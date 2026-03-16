import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { WalletProfile, RoastResult } from "@/types";

const mockValidatePayment = vi.fn();
const mockAnalyzeWallet = vi.fn();
const mockGenerateRoast = vi.fn();

vi.mock("@/lib/pump-agent", () => ({
  validatePayment: mockValidatePayment,
}));

vi.mock("@/lib/wallet-analyzer", () => ({
  analyzeWallet: mockAnalyzeWallet,
}));

vi.mock("@/lib/roast-generator", () => ({
  generateRoast: mockGenerateRoast,
}));

const MOCK_PROFILE: WalletProfile = {
  address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  solBalance: 0.003,
  tokenCount: 47,
  lowValueTokenCount: 43,
  topHoldings: [
    { mint: "bonk", symbol: "BONK", name: "Bonk", uiAmount: 1e6, uiValueUsd: 50 },
  ],
  recentTradeCount: 200,
  suspectedRugs: ["REKT", "SCAM"],
  nftCount: 12,
  walletAgeDays: 14,
  degenScore: 91,
};

const MOCK_ROAST: RoastResult = {
  roast: "You ape'd into everything at the top.\n\nVerdict: \"NGMI.\"",
  stats: { tokensHeld: 47, biggestBag: "BONK", rugCount: 2, degenScore: 91 },
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/roast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  memo: "123456789",
  amount: "500000",
  startTime: "1710000000",
  endTime: "1710086400",
};

describe("POST /api/roast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidatePayment.mockResolvedValue(true);
    mockAnalyzeWallet.mockResolvedValue(MOCK_PROFILE);
    mockGenerateRoast.mockResolvedValue(MOCK_ROAST);
  });

  it("returns roast result on verified payment", async () => {
    const { POST } = await import("@/app/api/roast/route");
    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.roast).toBeTruthy();
    expect(body.stats).toMatchObject({
      tokensHeld: 47,
      degenScore: 91,
    });
  });

  it("calls analyzeWallet with the correct wallet address", async () => {
    const { POST } = await import("@/app/api/roast/route");
    await POST(makeRequest(VALID_BODY));
    expect(mockAnalyzeWallet).toHaveBeenCalledWith(VALID_BODY.walletAddress);
  });

  it("returns 402 when payment is not verified", async () => {
    mockValidatePayment.mockResolvedValue(false);
    const { POST } = await import("@/app/api/roast/route");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(402);

    // Should NOT call analyzeWallet or generateRoast
    expect(mockAnalyzeWallet).not.toHaveBeenCalled();
    expect(mockGenerateRoast).not.toHaveBeenCalled();
  });

  it("always re-verifies payment server-side (never trusts client)", async () => {
    const { POST } = await import("@/app/api/roast/route");
    await POST(makeRequest(VALID_BODY));
    expect(mockValidatePayment).toHaveBeenCalledWith(
      VALID_BODY.walletAddress,
      expect.objectContaining({
        memo: VALID_BODY.memo,
        amount: VALID_BODY.amount,
      })
    );
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/roast/route");
    const res = await POST(makeRequest({ walletAddress: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 500 when wallet analysis throws", async () => {
    mockAnalyzeWallet.mockRejectedValue(new Error("RPC unavailable"));
    const { POST } = await import("@/app/api/roast/route");
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
