import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/pump-agent", () => ({
  buildInvoiceParams: vi.fn().mockReturnValue({
    memo: 123456789,
    amount: 500000,
    startTime: 1710000000,
    endTime: 1710086400,
  }),
  buildPaymentTransaction: vi.fn().mockResolvedValue("base64txdata=="),
}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: vi.fn().mockImplementation(function (key: string) {
    if (key === "invalid") throw new Error("Invalid public key");
    return { toBase58: () => key };
  }),
}));

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/invoice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns transaction and invoice on valid request", async () => {
    const { POST } = await import("@/app/api/invoice/route");
    const req = makeRequest({
      walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.transaction).toBe("base64txdata==");
    expect(body.invoice).toMatchObject({
      memo: 123456789,
      amount: 500000,
    });
  });

  it("returns 400 when walletAddress is missing", async () => {
    const { POST } = await import("@/app/api/invoice/route");
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when walletAddress is invalid", async () => {
    const { POST } = await import("@/app/api/invoice/route");
    const req = makeRequest({ walletAddress: "invalid" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
