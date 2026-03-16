export const SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

export const NEXT_PUBLIC_SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

export const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? "";

export const AGENT_TOKEN_MINT_ADDRESS =
  process.env.AGENT_TOKEN_MINT_ADDRESS ?? "";

export const CURRENCY_MINT =
  process.env.CURRENCY_MINT ?? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const PRICE_AMOUNT = Number(process.env.PRICE_AMOUNT ?? "500000");

export const PAYMENT_WINDOW_SECONDS = 86400; // 24 hours

export const VERIFY_MAX_ATTEMPTS = 10;
export const VERIFY_RETRY_DELAY_MS = 2000;

export const LOW_VALUE_THRESHOLD_USD = 1.0;

export const USDC_DECIMALS = 6;
export const SOL_DECIMALS = 9;

export const HELIUS_BASE_URL = "https://mainnet.helius-rpc.com";
