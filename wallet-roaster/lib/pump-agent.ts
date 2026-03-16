import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { PumpAgent, PumpAgentOffline } from "@pump-fun/agent-payments-sdk";
import {
  SOLANA_RPC_URL,
  AGENT_TOKEN_MINT_ADDRESS,
  CURRENCY_MINT,
  PRICE_AMOUNT,
  PAYMENT_WINDOW_SECONDS,
} from "./constants";
import type { InvoiceParams } from "@/types";

function getAgentMint(): PublicKey {
  if (!AGENT_TOKEN_MINT_ADDRESS) {
    throw new Error("AGENT_TOKEN_MINT_ADDRESS is not configured");
  }
  return new PublicKey(AGENT_TOKEN_MINT_ADDRESS);
}

export function getPumpAgentOffline(): PumpAgentOffline {
  return PumpAgentOffline.load(getAgentMint());
}

export function getPumpAgentOnline(): PumpAgent {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  return new PumpAgent(getAgentMint(), undefined, connection);
}

export function generateMemo(): string {
  return Math.floor(Math.random() * 1e15).toString();
}

export function buildInvoiceParams(): InvoiceParams {
  const now = Math.floor(Date.now() / 1000);
  return {
    memo: generateMemo(),
    amount: PRICE_AMOUNT.toString(),
    startTime: now.toString(),
    endTime: (now + PAYMENT_WINDOW_SECONDS).toString(),
  };
}

export async function buildPaymentTransaction(
  userPublicKey: PublicKey,
  invoice: InvoiceParams
): Promise<string> {
  const connection = new Connection(SOLANA_RPC_URL, "confirmed");
  const agent = getPumpAgentOffline();
  const currencyMint = new PublicKey(CURRENCY_MINT);

  const instructions = await agent.buildAcceptPaymentInstructions({
    user: userPublicKey,
    currencyMint,
    amount: invoice.amount,
    memo: invoice.memo,
    startTime: invoice.startTime,
    endTime: invoice.endTime,
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.add(...instructions);
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = userPublicKey;

  return Buffer.from(tx.serialize({ requireAllSignatures: false })).toString(
    "base64"
  );
}

export async function validatePayment(
  walletAddress: string,
  invoice: InvoiceParams
): Promise<boolean> {
  const agent = getPumpAgentOnline();
  const user = new PublicKey(walletAddress);
  const currencyMint = new PublicKey(CURRENCY_MINT);

  return agent.validateInvoicePayment({
    user,
    currencyMint,
    amount: Number(invoice.amount),
    memo: Number(invoice.memo),
    startTime: Number(invoice.startTime),
    endTime: Number(invoice.endTime),
  });
}
