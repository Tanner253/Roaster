import { PumpAgent } from "@pump-fun/agent-payments-sdk";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  SOLANA_RPC_URL,
  SOLANA_NETWORK,
  AGENT_TOKEN_MINT_ADDRESS,
  CURRENCY_MINT,
  PRICE_AMOUNT,
  PAYMENT_WINDOW_SECONDS,
} from "./constants";
import type { InvoiceParams } from "@/types";

let agentInstance: PumpAgent | null = null;
let connectionInstance: Connection | null = null;

function getAgentConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return connectionInstance;
}

export function getPumpAgent(): PumpAgent {
  if (!agentInstance) {
    if (!AGENT_TOKEN_MINT_ADDRESS) {
      throw new Error("AGENT_TOKEN_MINT_ADDRESS not configured");
    }
    const mint = new PublicKey(AGENT_TOKEN_MINT_ADDRESS);
    const environment =
      SOLANA_NETWORK === "mainnet-beta" ? "mainnet" : "devnet";
    agentInstance = new PumpAgent(mint, environment, getAgentConnection());
  }
  return agentInstance;
}

export function generateMemo(): number {
  return Math.floor(Math.random() * 900000000000) + 100000;
}

export function buildInvoiceParams(): InvoiceParams {
  const memo = generateMemo();
  const now = Math.floor(Date.now() / 1000);
  const startTime = now;
  const endTime = now + PAYMENT_WINDOW_SECONDS;
  const amount = PRICE_AMOUNT;

  return { amount, memo, startTime, endTime };
}

export async function buildPaymentTransaction(
  userPublicKey: PublicKey,
  invoice: InvoiceParams
): Promise<string> {
  const agent = getPumpAgent();
  const conn = getAgentConnection();
  const currencyMint = new PublicKey(CURRENCY_MINT);

  const agentInstructions = await agent.buildAcceptPaymentInstructions({
    user: userPublicKey,
    currencyMint,
    amount: String(invoice.amount),
    memo: String(invoice.memo),
    startTime: String(invoice.startTime),
    endTime: String(invoice.endTime),
  });

  const { blockhash } = await conn.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = userPublicKey;
  tx.add(...agentInstructions);

  return tx.serialize({ requireAllSignatures: false }).toString("base64");
}

export async function validatePayment(
  walletAddress: string,
  invoice: InvoiceParams
): Promise<boolean> {
  const agent = getPumpAgent();
  const currencyMint = new PublicKey(CURRENCY_MINT);
  const userPublicKey = new PublicKey(walletAddress);

  const params = {
    user: userPublicKey,
    currencyMint,
    amount: invoice.amount,
    memo: invoice.memo,
    startTime: invoice.startTime,
    endTime: invoice.endTime,
  };

  for (let attempt = 0; attempt < 10; attempt++) {
    const verified = await agent.validateInvoicePayment(params);
    if (verified) return true;
    if (attempt < 9) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return false;
}
