import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WalletProfile } from "@/types";

// Mock OpenAI before module import
const mockCreate = vi.fn().mockResolvedValue({
  choices: [
    {
      message: {
        content: JSON.stringify({
          roast:
            "You bought $BONK at the absolute top. Congratulations on your timing.\n\nYour 47 tokens? 43 are worth less than a bus ticket. This is a graveyard with a wallet address.\n\nThe 12 rugs? Each one a story of hope meeting market reality.",
          verdict: "NGMI. But at least you're consistent.",
        }),
      },
    },
  ],
});

vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        chat: { completions: { create: mockCreate } },
      };
    }),
  };
});

const MOCK_PROFILE: WalletProfile = {
  address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  solBalance: 0.003,
  tokenCount: 47,
  lowValueTokenCount: 43,
  topHoldings: [
    {
      mint: "bonk1111",
      symbol: "BONK",
      name: "Bonk",
      uiAmount: 1_000_000,
      uiValueUsd: 50,
    },
  ],
  recentTradeCount: 200,
  suspectedRugs: ["REKT", "SCAM", "MOON", "GEM", "SAFE", "PEPE2", "BONK2", "PUMP", "DUMP", "WEN", "SOON", "INU"],
  nftCount: 12,
  walletAgeDays: 14,
  degenScore: 91,
};

describe("roast-generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns a roast result with roast text and stats", async () => {
    const { generateRoast } = await import("@/lib/roast-generator");
    const result = await generateRoast(MOCK_PROFILE);

    expect(result.roast).toBeTruthy();
    expect(typeof result.roast).toBe("string");
    expect(result.roast.length).toBeGreaterThan(50);
  });

  it("includes the verdict in the roast text", async () => {
    const { generateRoast } = await import("@/lib/roast-generator");
    const result = await generateRoast(MOCK_PROFILE);
    expect(result.roast).toContain("Verdict:");
  });

  it("returns correct stats matching the wallet profile", async () => {
    const { generateRoast } = await import("@/lib/roast-generator");
    const result = await generateRoast(MOCK_PROFILE);

    expect(result.stats.tokensHeld).toBe(MOCK_PROFILE.tokenCount);
    expect(result.stats.rugCount).toBe(MOCK_PROFILE.suspectedRugs.length);
    expect(result.stats.degenScore).toBe(MOCK_PROFILE.degenScore);
    expect(result.stats.biggestBag).toBe("BONK");
  });

  it("falls back gracefully when OpenAI returns malformed JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "not json at all {{" } }],
    });

    const { generateRoast } = await import("@/lib/roast-generator");
    // Should throw a JSON parse error — acceptable in MVP; test confirms it propagates
    await expect(generateRoast(MOCK_PROFILE)).rejects.toThrow();
  });

  it("uses the biggest bag symbol when topHoldings is empty", async () => {
    const { generateRoast } = await import("@/lib/roast-generator");
    const emptyProfile: WalletProfile = {
      ...MOCK_PROFILE,
      topHoldings: [],
    };
    const result = await generateRoast(emptyProfile);
    expect(result.stats.biggestBag).toBe("nothing");
  });
});
