import { NextRequest, NextResponse } from "next/server";
import { validatePayment } from "@/lib/pump-agent";
import { VERIFY_MAX_ATTEMPTS, VERIFY_RETRY_DELAY_MS } from "@/lib/constants";
import type { VerifyRequest, VerifyResponse } from "@/types";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    for (let attempt = 0; attempt < VERIFY_MAX_ATTEMPTS; attempt++) {
      const verified = await validatePayment(walletAddress, invoice);
      if (verified) {
        const response: VerifyResponse = { verified: true };
        return NextResponse.json(response);
      }
      if (attempt < VERIFY_MAX_ATTEMPTS - 1) {
        await sleep(VERIFY_RETRY_DELAY_MS);
      }
    }

    const response: VerifyResponse = { verified: false };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/verify]", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
