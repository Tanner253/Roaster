import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { buildInvoiceParams, buildPaymentTransaction } from "@/lib/pump-agent";
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

    const invoice = buildInvoiceParams();
    const transaction = await buildPaymentTransaction(userPublicKey, invoice);

    const response: InvoiceResponse = { transaction, invoice };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/invoice]", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
