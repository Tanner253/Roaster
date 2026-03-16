import { NextRequest, NextResponse } from "next/server";
import { validatePayment } from "@/lib/pump-agent";
import { analyzeWallet } from "@/lib/wallet-analyzer";
import { generateRoast } from "@/lib/roast-generator";
import type { RoastRequest, RoastResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RoastRequest;
    const { walletAddress, memo, amount, startTime, endTime } = body;

    if (!walletAddress || !memo || !amount || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Server-side payment re-verification — never trust the client
    const invoice = { memo, amount, startTime, endTime };
    const verified = await validatePayment(walletAddress, invoice);

    if (!verified) {
      return NextResponse.json(
        { error: "Payment not verified" },
        { status: 402 }
      );
    }

    const profile = await analyzeWallet(walletAddress);
    const result = await generateRoast(profile);

    return NextResponse.json(result satisfies RoastResult);
  } catch (error) {
    console.error("[/api/roast]", error);
    return NextResponse.json(
      { error: "Failed to generate roast" },
      { status: 500 }
    );
  }
}
