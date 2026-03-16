import { NextRequest, NextResponse } from "next/server";
import { validatePayment } from "@/lib/pump-agent";
import type { VerifyRequest, VerifyResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyRequest;
    const { walletAddress, memo, amount, startTime, endTime } = body;

    if (!walletAddress || !memo || !amount || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const invoice = { memo, amount, startTime, endTime };
    const verified = await validatePayment(walletAddress, invoice);

    const response: VerifyResponse = { verified };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/verify]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
