import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  SOLANA_RPC_URL,
  HELIUS_API_KEY,
  HELIUS_BASE_URL,
  LOW_VALUE_THRESHOLD_USD,
} from "./constants";
import type { WalletProfile, TokenHolding } from "@/types";

interface HeliusAsset {
  id: string;
  interface: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
  };
  token_info?: {
    symbol?: string;
    balance?: number;
    decimals?: number;
    price_info?: {
      price_per_token?: number;
      total_price?: number;
    };
  };
}

interface HeliusAssetsResponse {
  result: {
    items: HeliusAsset[];
    total: number;
  };
}

async function getAssetsByOwner(address: string): Promise<HeliusAsset[]> {
  const url = HELIUS_API_KEY
    ? `${HELIUS_BASE_URL}/?api-key=${HELIUS_API_KEY}`
    : SOLANA_RPC_URL;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "get-assets",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: address,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
          showZeroBalance: false,
        },
      },
    }),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    result?: HeliusAssetsResponse["result"];
  };
  return data.result?.items ?? [];
}

async function getSolBalance(address: string): Promise<number> {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const pubkey = new PublicKey(address);
  const lamports = await connection.getBalance(pubkey);
  return lamports / LAMPORTS_PER_SOL;
}

async function getWalletAgeDays(address: string): Promise<number> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const pubkey = new PublicKey(address);

    const oldestSigs = await connection.getSignaturesForAddress(pubkey, {
      limit: 1,
    });

    const blockTime = oldestSigs[0]?.blockTime;
    if (!blockTime) return 0;

    const ageMs = Date.now() - blockTime * 1000;
    return Math.floor(ageMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

async function getRecentTradeCount(address: string): Promise<number> {
  try {
    const connection = new Connection(SOLANA_RPC_URL, "confirmed");
    const pubkey = new PublicKey(address);
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;

    const sigs = await connection.getSignaturesForAddress(pubkey, {
      limit: 200,
    });

    return sigs.filter(
      (s) => s.blockTime && s.blockTime >= thirtyDaysAgo && !s.err
    ).length;
  } catch {
    return 0;
  }
}

function categorizeAssets(assets: HeliusAsset[]): {
  tokens: TokenHolding[];
  nftCount: number;
  lowValueCount: number;
  suspectedRugs: string[];
} {
  const tokens: TokenHolding[] = [];
  let nftCount = 0;
  let lowValueCount = 0;
  const suspectedRugs: string[] = [];

  for (const asset of assets) {
    const isFungible =
      asset.interface === "FungibleToken" ||
      asset.interface === "FungibleAsset";
    const isNFT =
      asset.interface === "V1_NFT" ||
      asset.interface === "ProgrammableNFT" ||
      asset.interface === "V2_NFT";

    if (isNFT) {
      nftCount++;
      continue;
    }

    if (!isFungible) continue;

    const tokenInfo = asset.token_info;
    if (!tokenInfo) continue;

    const decimals = tokenInfo.decimals ?? 0;
    const rawBalance = tokenInfo.balance ?? 0;
    const uiAmount = rawBalance / Math.pow(10, decimals);
    const pricePerToken = tokenInfo.price_info?.price_per_token ?? 0;
    const uiValueUsd = uiAmount * pricePerToken;

    const symbol =
      tokenInfo.symbol ??
      asset.content?.metadata?.symbol ??
      asset.id.slice(0, 8);
    const name = asset.content?.metadata?.name ?? symbol;

    const holding: TokenHolding = {
      mint: asset.id,
      symbol,
      name,
      uiAmount,
      uiValueUsd,
    };

    tokens.push(holding);

    if (uiValueUsd < LOW_VALUE_THRESHOLD_USD && uiAmount > 0) {
      lowValueCount++;
    }

    if (uiAmount > 0 && pricePerToken === 0) {
      suspectedRugs.push(symbol);
    }
  }

  tokens.sort((a, b) => b.uiValueUsd - a.uiValueUsd);

  return { tokens, nftCount, lowValueCount, suspectedRugs };
}

function calculateDegenScore(
  profile: Omit<WalletProfile, "degenScore">
): number {
  let score = 0;

  score += Math.min(profile.tokenCount * 0.5, 20);
  score += Math.min(profile.lowValueTokenCount * 1.5, 25);
  score += Math.min(profile.suspectedRugs.length * 3, 20);
  score += Math.min(profile.recentTradeCount * 0.2, 20);

  if (profile.solBalance < 0.1) score += 10;
  else if (profile.solBalance < 0.5) score += 5;

  score += Math.min(profile.nftCount * 0.5, 5);

  return Math.min(Math.round(score), 100);
}

export async function analyzeWallet(address: string): Promise<WalletProfile> {
  const [assets, solBalance, walletAgeDays, recentTradeCount] =
    await Promise.all([
      getAssetsByOwner(address),
      getSolBalance(address),
      getWalletAgeDays(address),
      getRecentTradeCount(address),
    ]);

  const { tokens, nftCount, lowValueCount, suspectedRugs } =
    categorizeAssets(assets);

  const profileBase = {
    address,
    solBalance,
    tokenCount: tokens.length,
    lowValueTokenCount: lowValueCount,
    topHoldings: tokens.slice(0, 5),
    recentTradeCount,
    suspectedRugs: suspectedRugs.slice(0, 10),
    nftCount,
    walletAgeDays,
  };

  const degenScore = calculateDegenScore(profileBase);

  return { ...profileBase, degenScore };
}
