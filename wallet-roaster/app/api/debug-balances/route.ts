import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getPumpAgent } from "@/lib/pump-agent";
import { CURRENCY_MINT, AGENT_TOKEN_MINT_ADDRESS } from "@/lib/constants";

export async function GET() {
  try {
    const agent = getPumpAgent();
    const currencyMint = new PublicKey(CURRENCY_MINT);
    const balances = await agent.getBalances(currencyMint);

    return NextResponse.json({
      agentMint: AGENT_TOKEN_MINT_ADDRESS,
      currencyMint: CURRENCY_MINT,
      paymentVault: {
        address: balances.paymentVault.address.toBase58(),
        balance: balances.paymentVault.balance.toString(),
      },
      buybackVault: {
        address: balances.buybackVault.address.toBase58(),
        balance: balances.buybackVault.balance.toString(),
      },
      withdrawVault: {
        address: balances.withdrawVault.address.toBase58(),
        balance: balances.withdrawVault.balance.toString(),
      },
    });
  } catch (error) {
    console.error("[/api/debug-balances]", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
