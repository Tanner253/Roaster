import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies before importing the module under test
const mockGetBalance = vi.fn().mockResolvedValue(2_000_000_000); // 2 SOL
const mockGetSignaturesForAddress = vi.fn().mockResolvedValue([
  { signature: "sig1", blockTime: Math.floor(Date.now() / 1000) - 86400 * 10, err: null },
  { signature: "sig2", blockTime: Math.floor(Date.now() / 1000) - 86400 * 5, err: null },
]);

vi.mock("@solana/web3.js", () => {
  return {
    Connection: vi.fn().mockImplementation(function () {
      return {
        getBalance: mockGetBalance,
        getSignaturesForAddress: mockGetSignaturesForAddress,
      };
    }),
    PublicKey: vi.fn().mockImplementation(function (key: string) {
      return { toBase58: () => key };
    }),
    LAMPORTS_PER_SOL: 1_000_000_000,
  };
});

// Mock fetch for Helius API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("wallet-analyzer", () => {
  const TEST_ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: Helius returns a mix of fungible tokens and NFTs
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          items: [
            {
              id: "So11111111111111111111111111111111111111112",
              interface: "FungibleToken",
              content: { metadata: { name: "Wrapped SOL", symbol: "SOL" } },
              token_info: {
                symbol: "SOL",
                balance: 5_000_000_000,
                decimals: 9,
                price_info: { price_per_token: 150, total_price: 750 },
              },
            },
            {
              id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              interface: "FungibleToken",
              content: { metadata: { name: "USD Coin", symbol: "USDC" } },
              token_info: {
                symbol: "USDC",
                balance: 100_000_000,
                decimals: 6,
                price_info: { price_per_token: 1, total_price: 100 },
              },
            },
            {
              id: "RUGTOKEN111111111111111111111111111111111111",
              interface: "FungibleToken",
              content: { metadata: { name: "RugToken", symbol: "REKT" } },
              token_info: {
                symbol: "REKT",
                balance: 1_000_000_000_000,
                decimals: 9,
                price_info: { price_per_token: 0, total_price: 0 },
              },
            },
            {
              id: "NFTTOKEN11111111111111111111111111111111111",
              interface: "V1_NFT",
              content: { metadata: { name: "Dead NFT #1" } },
            },
          ],
          total: 4,
        },
      }),
    });
  });

  it("returns a WalletProfile with the correct address", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.address).toBe(TEST_ADDRESS);
  });

  it("correctly reads SOL balance", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.solBalance).toBe(2); // 2_000_000_000 / LAMPORTS_PER_SOL
  });

  it("counts fungible token holdings (excludes NFTs)", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.tokenCount).toBe(3); // SOL, USDC, REKT
    expect(profile.nftCount).toBe(1);
  });

  it("identifies suspected rugged tokens (zero price)", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.suspectedRugs).toContain("REKT");
  });

  it("counts low-value token positions (< $1)", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.lowValueTokenCount).toBeGreaterThanOrEqual(1); // REKT is $0
  });

  it("sorts top holdings by USD value descending", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    const values = profile.topHoldings.map((h) => h.uiValueUsd);
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]);
    }
  });

  it("calculates a degenScore between 0 and 100", async () => {
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.degenScore).toBeGreaterThanOrEqual(0);
    expect(profile.degenScore).toBeLessThanOrEqual(100);
  });

  it("handles Helius API failure gracefully", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const { analyzeWallet } = await import("@/lib/wallet-analyzer");
    const profile = await analyzeWallet(TEST_ADDRESS);
    expect(profile.tokenCount).toBe(0);
    expect(profile.nftCount).toBe(0);
  });
});
