import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockValidatePayment = vi.fn();

vi.mock("@/lib/pump-agent", () => ({
  validatePayment: mockValidatePayment,
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  memo: 123456789,
  amount: 500000,
  startTime: 1710000000,
  endTime: 1710086400,
};

describe("POST /api/verify", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns { verified: true } when payment is confirmed", async () => {
    mockValidatePayment.mockResolvedValue(true);
    const { POST } = await import("@/app/api/verify/route");
    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(mockValidatePayment).toHaveBeenCalledTimes(1);
  });

  it("returns { verified: false } when payment is not confirmed", async () => {
    mockValidatePayment.mockResolvedValue(false);
    const { POST } = await import("@/app/api/verify/route");
    const res = await POST(makeRequest(VALID_BODY));
    const body = await res.json();

    expect(body.verified).toBe(false);
    expect(mockValidatePayment).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/verify/route");
    const res = await POST(makeRequest({ walletAddress: "abc" }));
    expect(res.status).toBe(400);
  });
});
