import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { buildInvoiceParams, buildPaymentTransaction } from "@/lib/pump-agent";
import {
  SOLANA_NETWORK,
  SOLANA_RPC_URL,
  AGENT_TOKEN_MINT_ADDRESS,
  CURRENCY_MINT,
  PRICE_AMOUNT,
} from "@/lib/constants";
import type { InvoiceRequest, InvoiceResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InvoiceRequest;
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    let userPublicKey: PublicKey;
    try {
      userPublicKey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    console.log("[/api/invoice] config:", {
      network: SOLANA_NETWORK,
      environment: SOLANA_NETWORK === "mainnet-beta" ? "mainnet" : "devnet",
      rpc: SOLANA_RPC_URL.slice(0, 40),
      agentMint: AGENT_TOKEN_MINT_ADDRESS,
      currencyMint: CURRENCY_MINT,
      priceAmount: PRICE_AMOUNT,
      payer: walletAddress,
    });

    const invoice = buildInvoiceParams();
    const transaction = await buildPaymentTransaction(userPublicKey, invoice);

    console.log("[/api/invoice] built invoice:", invoice);

    const response: InvoiceResponse = { transaction, invoice };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/invoice] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
