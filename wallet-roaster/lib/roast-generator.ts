import OpenAI from "openai";
import type { WalletProfile, RoastResult, RoastStats } from "@/types";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are the Wallet Roaster — a savage, brutally funny AI that roasts people based on their Solana wallet activity. You're like a crypto comedy roast host.

Rules:
- Be BRUTAL but FUNNY. Never boring, never generic.
- Reference SPECIFIC tokens, amounts, and behaviors from the wallet data provided.
- Use crypto/degen slang naturally (ape, rug, bag, cope, ngmi, wagmi, gm, etc.)
- Keep it to 3-5 hard-hitting paragraphs.
- End with a one-liner verdict.
- Never be actually mean-spirited or target personal identity — roast the TRADES only.
- If the wallet is actually profitable, reluctantly acknowledge it but find something else to roast.

Format your response as valid JSON with this exact structure:
{
  "roast": "full roast text with paragraphs separated by \\n\\n",
  "verdict": "one-liner verdict"
}`;

function buildWalletSummary(profile: WalletProfile): string {
  const topHoldingsText =
    profile.topHoldings.length > 0
      ? profile.topHoldings
          .map((h) => `${h.symbol} ($${h.uiValueUsd.toFixed(2)})`)
          .join(", ")
      : "nothing worth mentioning";

  const rugText =
    profile.suspectedRugs.length > 0
      ? profile.suspectedRugs.join(", ")
      : "none found";

  return `
Wallet Address: ${profile.address.slice(0, 8)}...${profile.address.slice(-4)}
SOL Balance: ${profile.solBalance.toFixed(4)} SOL
Total Token Positions: ${profile.tokenCount}
Positions Worth Less Than $1: ${profile.lowValueTokenCount}
Top Holdings by Value: ${topHoldingsText}
Suspected Rugged Tokens (zero price): ${rugText}
NFTs Held: ${profile.nftCount}
Trades in Last 30 Days: ${profile.recentTradeCount}
Wallet Age: ${profile.walletAgeDays} days
Degen Score: ${profile.degenScore}/100
`.trim();
}

export async function generateRoast(
  profile: WalletProfile
): Promise<RoastResult> {
  const walletSummary = buildWalletSummary(profile);

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Roast this wallet:\n\n${walletSummary}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
    max_tokens: 1000,
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { roast?: string; verdict?: string };

  const roastText =
    parsed.roast ??
    "Your wallet is so empty even the AI has nothing to say.";
  const verdict = parsed.verdict ?? "NGMI.";

  const biggestBag = profile.topHoldings[0]?.symbol ?? "nothing";

  const stats: RoastStats = {
    tokensHeld: profile.tokenCount,
    biggestBag,
    rugCount: profile.suspectedRugs.length,
    degenScore: profile.degenScore,
  };

  return {
    roast: `${roastText}\n\nVerdict: "${verdict}"`,
    stats,
  };
}
