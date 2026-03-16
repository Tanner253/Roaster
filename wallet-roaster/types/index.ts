export interface InvoiceParams {
  memo: string;
  amount: string;
  startTime: string;
  endTime: string;
}

export interface WalletProfile {
  address: string;
  solBalance: number;
  tokenCount: number;
  lowValueTokenCount: number;
  topHoldings: TokenHolding[];
  recentTradeCount: number;
  suspectedRugs: string[];
  nftCount: number;
  walletAgeDays: number;
  degenScore: number;
}

export interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  uiAmount: number;
  uiValueUsd: number;
}

export interface RoastStats {
  tokensHeld: number;
  biggestBag: string;
  rugCount: number;
  degenScore: number;
}

export interface RoastResult {
  roast: string;
  stats: RoastStats;
}

export interface InvoiceRequest {
  walletAddress: string;
  targetWallet?: string;
}

export interface InvoiceResponse {
  transaction: string;
  invoice: InvoiceParams;
}

export interface VerifyRequest {
  walletAddress: string;
  memo: string;
  amount: string;
  startTime: string;
  endTime: string;
}

export interface VerifyResponse {
  verified: boolean;
}

export interface RoastRequest {
  walletAddress: string;
  memo: string;
  amount: string;
  startTime: string;
  endTime: string;
}
