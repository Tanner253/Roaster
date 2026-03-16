import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { PumpAgent } from "@pump-fun/agent-payments-sdk";
import {
  SOLANA_RPC_URL,
  AGENT_TOKEN_MINT_ADDRESS,
  CURRENCY_MINT,
  PRICE_AMOUNT,
  PAYMENT_WINDOW_SECONDS,
} from "./constants";
import type { InvoiceParams } from "@/types";

let _pumpAgent: PumpAgent | null = null;

function getAgentMint(): PublicKey {
  if (!AGENT_TOKEN_MINT_ADDRESS) {
    throw new Error("AGENT_TOKEN_MINT_ADDRESS is not configured");
  }
  return new PublicKey(AGENT_TOKEN_MINT_ADDRESS);
}

function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

export function getPumpAgent(): PumpAgent {
  if (!_pumpAgent) {
    _pumpAgent = new PumpAgent(getAgentMint(), "mainnet", getConnection());
  }
  return _pumpAgent;
}

export function generateMemo(): number {
  return Math.floor(Math.random() * 900000000000) + 100000;
}

export function buildInvoiceParams(): InvoiceParams {
  const now = Math.floor(Date.now() / 1000);
  return {
    amount: PRICE_AMOUNT,
    memo: generateMemo(),
    startTime: now,
    endTime: now + PAYMENT_WINDOW_SECONDS,
  };
}

export async function buildPaymentTransaction(
  userPublicKey: PublicKey,
  invoice: InvoiceParams
): Promise<string> {
  const agent = getPumpAgent();
  const conn = getConnection();
  const currencyMint = new PublicKey(CURRENCY_MINT);

  const instructions = await agent.buildAcceptPaymentInstructions({
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
  tx.add(...instructions);

  return tx.serialize({ requireAllSignatures: false }).toString("base64");
}

export async function validatePayment(
  walletAddress: string,
  invoice: InvoiceParams
): Promise<boolean> {
  const agent = getPumpAgent();
  const user = new PublicKey(walletAddress);
  const currencyMint = new PublicKey(CURRENCY_MINT);

  return agent.validateInvoicePayment({
    user,
    currencyMint,
    amount: invoice.amount,
    memo: invoice.memo,
    startTime: invoice.startTime,
    endTime: invoice.endTime,
  });
}
