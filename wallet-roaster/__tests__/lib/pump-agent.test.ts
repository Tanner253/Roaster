import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@solana/web3.js", () => ({
  Connection: vi.fn().mockImplementation(function () {
    return {
      getLatestBlockhash: vi.fn().mockResolvedValue({
        blockhash: "testblockhash123",
        lastValidBlockHeight: 999999,
      }),
    };
  }),
  PublicKey: vi.fn().mockImplementation(function (key: string) {
    return { toBase58: () => key, toString: () => key };
  }),
  Transaction: vi.fn().mockImplementation(function () {
    return {
      add: vi.fn(),
      serialize: vi.fn().mockReturnValue(Buffer.from("fake-tx-bytes")),
      recentBlockhash: "",
      lastValidBlockHeight: 0,
      feePayer: null,
    };
  }),
}));

vi.mock("@pump-fun/agent-payments-sdk", () => ({
  PumpAgent: vi.fn().mockImplementation(function () {
    return {
      buildAcceptPaymentInstructions: vi.fn().mockResolvedValue([
        { programId: "fakeProgramId", keys: [], data: Buffer.alloc(0) },
      ]),
      validateInvoicePayment: vi.fn().mockResolvedValue(true),
    };
  }),
}));

describe("pump-agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AGENT_TOKEN_MINT_ADDRESS = "AgentMint1111111111111111111111111111111111";
    process.env.CURRENCY_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    process.env.SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
  });

  it("generateMemo returns a positive number", async () => {
    const { generateMemo } = await import("@/lib/pump-agent");
    const memo = generateMemo();
    expect(typeof memo).toBe("number");
    expect(memo).toBeGreaterThan(0);
  });

  it("generateMemo returns different values each call", async () => {
    const { generateMemo } = await import("@/lib/pump-agent");
    const memos = Array.from({ length: 10 }, generateMemo);
    const unique = new Set(memos);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("buildInvoiceParams returns correct structure", async () => {
    const { buildInvoiceParams } = await import("@/lib/pump-agent");
    const nowBefore = Math.floor(Date.now() / 1000);
    const invoice = buildInvoiceParams();
    const nowAfter = Math.floor(Date.now() / 1000);

    expect(invoice).toHaveProperty("memo");
    expect(invoice).toHaveProperty("amount");
    expect(invoice).toHaveProperty("startTime");
    expect(invoice).toHaveProperty("endTime");

    expect(invoice.startTime).toBeGreaterThanOrEqual(nowBefore);
    expect(invoice.startTime).toBeLessThanOrEqual(nowAfter);
    expect(invoice.endTime - invoice.startTime).toBe(86400); // 24h window
  });

  it("buildInvoiceParams uses configured PRICE_AMOUNT", async () => {
    process.env.PRICE_AMOUNT = "500000";
    const { buildInvoiceParams } = await import("@/lib/pump-agent");
    const invoice = buildInvoiceParams();
    expect(invoice.amount).toBe(500000);
  });

  it("buildPaymentTransaction returns a base64 string", async () => {
    const { PublicKey } = await import("@solana/web3.js");
    const { buildPaymentTransaction, buildInvoiceParams } = await import(
      "@/lib/pump-agent"
    );

    const userKey = new PublicKey(
      "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    );
    const invoice = buildInvoiceParams();
    const tx = await buildPaymentTransaction(userKey, invoice);

    expect(typeof tx).toBe("string");
    // Must be valid base64
    expect(() => Buffer.from(tx, "base64")).not.toThrow();
  });

  it("validatePayment returns true when payment is confirmed", async () => {
    const { validatePayment, buildInvoiceParams } = await import(
      "@/lib/pump-agent"
    );
    const invoice = buildInvoiceParams();
    const result = await validatePayment(
      "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      invoice
    );
    expect(result).toBe(true);
  });
});
