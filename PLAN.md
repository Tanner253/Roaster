# Wallet Roaster — MVP Planning Document

**Tagline:** "Pay $0.50 to get your on-chain history dragged by AI. Every fee buys back $TOKEN."

---

## 1. Product Overview

Wallet Roaster is a paid AI roast service for Solana wallets. Users connect their wallet (or paste any wallet address), pay $0.50 USDC, and receive a brutal, personalized AI-generated roast based on their on-chain history — the rugs they held, the tops they bought, the bottoms they sold, and every degen decision in between.

Every payment flows through a Pump Tokenized Agent, meaning a configurable percentage of revenue automatically buys back the $TOKEN — so every roast pumps the bag.

### Why It Works

| Lever           | Why                                                              |
| --------------- | ---------------------------------------------------------------- |
| Impulse price   | $0.50 is low enough nobody thinks twice                          |
| Viral by design | Roasts are inherently shareable — screenshots = free marketing   |
| Token flywheel  | Revenue → buyback → price up → more attention → more roasts     |
| Simple to build | Wallet fetch + LLM prompt = MVP in days                         |
| Meme branding   | "GET REKT", "DEGEN ROAST" etc. writes itself for crypto Twitter  |

---

## 2. Tech Stack

| Layer        | Choice                                       | Why                                                    |
| ------------ | -------------------------------------------- | ------------------------------------------------------ |
| Framework    | **Next.js 14 (App Router)**                  | SSR, API routes, fast deployment on Vercel              |
| Language     | **TypeScript**                               | Type safety across client + server                     |
| Styling      | **Tailwind CSS**                             | Rapid UI development, easy theming                     |
| Payments     | **@pump-fun/agent-payments-sdk**             | Tokenized agent invoice creation + verification        |
| Wallet       | **@solana/wallet-adapter-react**             | Standard Solana wallet connection (Phantom, Solflare)  |
| Wallet Data  | **Helius DAS API + Solana RPC**              | Fetch token holdings, transaction history, NFTs        |
| AI           | **OpenAI GPT-4o (or Claude)**                | Roast generation via structured prompt                 |
| Deployment   | **Vercel**                                   | Zero-config Next.js hosting, edge functions            |
| Analytics    | **Vercel Analytics** (optional)              | Usage tracking                                         |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                   │
│                                                             │
│  Landing Page → Connect Wallet → Pay $0.50 → View Roast    │
│       │              │              │             │          │
│       │         WalletAdapter   Sign TX      Share Button   │
└───────┼──────────────┼──────────────┼────────────┼──────────┘
        │              │              │            │
        ▼              ▼              ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                     │
│                                                             │
│  POST /api/invoice      — Generate invoice + build TX       │
│  POST /api/verify       — Verify payment on-chain           │
│  POST /api/roast        — Fetch wallet data + generate roast│
└───────┬─────────────────────────┬───────────────────────────┘
        │                         │
        ▼                         ▼
┌───────────────┐    ┌────────────────────────┐
│  Pump Agent   │    │   Helius / Solana RPC  │
│  SDK          │    │   (wallet history)     │
│  (payments)   │    │                        │
└───────────────┘    └────────────────────────┘
        │                         │
        ▼                         ▼
┌───────────────┐    ┌────────────────────────┐
│  Solana       │    │   OpenAI / Claude API  │
│  (on-chain)   │    │   (roast generation)   │
└───────────────┘    └────────────────────────┘
```

---

## 4. Core User Flow

```
1. User lands on site → sees bold "GET ROASTED" branding
          ↓
2. User connects Solana wallet (Phantom/Solflare)
   OR pastes any wallet address to roast
          ↓
3. User clicks "ROAST ME" ($0.50)
          ↓
4. Client calls POST /api/invoice with { walletAddress }
   → Server generates invoice params (memo, timestamps, amount)
   → Server builds unsigned TX via PumpAgent SDK
   → Returns base64 TX + invoice params to client
          ↓
5. Client deserializes TX → wallet prompts user to sign
   → Client sends signed TX on-chain
   → Client calls POST /api/verify with invoice params + signature
          ↓
6. Server verifies payment via PumpAgent.validateInvoicePayment()
   → On success, calls POST /api/roast internally
          ↓
7. Server fetches wallet on-chain data:
   - Token holdings (current bags)
   - Recent transaction history (buys, sells, swaps)
   - Notable tokens (rugged tokens, memecoins, etc.)
   - P&L indicators where possible
          ↓
8. Server sends wallet summary to LLM with roast prompt
   → LLM returns brutal personalized roast
          ↓
9. Client displays roast in stylized card with:
   - The roast text
   - Wallet address (truncated)
   - "Share on X" button (pre-filled tweet)
   - "Copy Roast" button
   - "Roast Another" button
```

---

## 5. Project Structure

```
wallet-roaster/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout + WalletProvider
│   │   ├── page.tsx                # Landing page / main UI
│   │   ├── globals.css             # Tailwind + custom styles
│   │   └── api/
│   │       ├── invoice/route.ts    # Generate invoice + build TX
│   │       ├── verify/route.ts     # Verify payment on-chain
│   │       └── roast/route.ts      # Fetch wallet data + AI roast
│   ├── components/
│   │   ├── WalletProvider.tsx      # Solana wallet adapter wrapper
│   │   ├── RoastCard.tsx           # Displays the roast result
│   │   ├── PaymentButton.tsx       # Handles pay + sign flow
│   │   ├── WalletInput.tsx         # Wallet address input / connect
│   │   └── ShareButtons.tsx        # Twitter share + copy buttons
│   ├── lib/
│   │   ├── pump-agent.ts           # PumpAgent singleton + helpers
│   │   ├── wallet-analyzer.ts      # Fetch + analyze wallet data
│   │   ├── roast-generator.ts      # LLM prompt + roast generation
│   │   └── constants.ts            # Shared constants
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── public/
│   └── og-image.png                # Open Graph image for sharing
├── .env.local                      # Environment variables (not committed)
├── .env.example                    # Template for env vars
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. API Route Specifications

### POST `/api/invoice`

**Purpose:** Generate a payment invoice and return an unsigned transaction.

**Request:**
```json
{
  "walletAddress": "Abc123...xyz",
  "targetWallet": "Abc123...xyz"  // optional — wallet to roast (defaults to payer)
}
```

**Response:**
```json
{
  "transaction": "<base64 serialized unsigned TX>",
  "invoice": {
    "memo": "482910374621",
    "amount": "500000",
    "startTime": "1710000000",
    "endTime": "1710086400"
  }
}
```

**Logic:**
1. Generate unique memo (random number)
2. Set time window (now → +24h)
3. Build payment instructions via `PumpAgent.buildAcceptPaymentInstructions()`
4. Assemble into Transaction with recent blockhash
5. Serialize unsigned TX as base64
6. Return TX + invoice params

---

### POST `/api/verify`

**Purpose:** Verify that the user actually paid the invoice on-chain.

**Request:**
```json
{
  "walletAddress": "Abc123...xyz",
  "memo": "482910374621",
  "amount": "500000",
  "startTime": "1710000000",
  "endTime": "1710086400"
}
```

**Response:**
```json
{
  "verified": true
}
```

**Logic:**
1. Call `PumpAgent.validateInvoicePayment()` with retry loop (up to 10 attempts, 2s apart)
2. Return `{ verified: true/false }`

---

### POST `/api/roast`

**Purpose:** Fetch wallet on-chain data and generate the AI roast.

**Request:**
```json
{
  "walletAddress": "Abc123...xyz",
  "memo": "482910374621",
  "amount": "500000",
  "startTime": "1710000000",
  "endTime": "1710086400"
}
```

**Response:**
```json
{
  "roast": "Bro you bought $BONK at the absolute top, held through a 95% drop...",
  "stats": {
    "tokensHeld": 47,
    "biggestBag": "$WIF",
    "rugCount": 12,
    "degenScore": 94
  }
}
```

**Logic:**
1. Re-verify payment (never trust client — server-side check)
2. Fetch wallet token holdings via Helius DAS API or `getTokenAccountsByOwner`
3. Fetch recent transaction signatures + parse swap history
4. Build wallet profile (bags, rugs, P&L indicators, notable tokens)
5. Send wallet summary to LLM with roast system prompt
6. Return roast text + fun stats

---

## 7. Wallet Analysis Strategy

The wallet analyzer needs to extract "roastable" data. Here's what to fetch and how:

### Data Sources

| Data                    | Method                                    | Roast Angle                                    |
| ----------------------- | ----------------------------------------- | ---------------------------------------------- |
| Current token holdings  | `getTokenAccountsByOwner` + token metadata| "You're STILL holding $RUGCOIN?"               |
| Token balances near $0  | Filter low-value holdings                 | "47 tokens worth less than a pack of gum"      |
| Transaction history     | `getSignaturesForAddress` (last 100-200)  | "You made 200 trades this month, grass exists"  |
| Swap history            | Parse Jupiter/Raydium/Pump swap logs      | "Bought the top, sold the bottom, speedrun"    |
| SOL balance             | `getBalance`                              | "0.003 SOL left — can't even afford gas"       |
| NFT holdings            | Helius DAS `getAssetsByOwner`             | "You own 12 dead NFT projects"                 |
| Wallet age              | Earliest transaction timestamp            | "Account is 2 weeks old, already rekt"         |

### Analysis Pipeline

```typescript
interface WalletProfile {
  address: string;
  solBalance: number;
  tokenCount: number;
  lowValueTokenCount: number;      // tokens worth < $1
  topHoldings: TokenHolding[];     // top 5 by value
  recentTradeCount: number;        // trades in last 30 days
  suspectedRugs: string[];         // tokens that went to ~0
  nftCount: number;
  walletAgeDays: number;
  degenScore: number;              // 0-100 composite score
}
```

---

## 8. AI Roast Generation

### System Prompt (Draft)

```
You are the Wallet Roaster — a savage, brutally funny AI that roasts people
based on their Solana wallet activity. You're like a crypto comedy roast host.

Rules:
- Be BRUTAL but FUNNY. Never boring, never generic.
- Reference SPECIFIC tokens, amounts, and behaviors from the wallet data.
- Use crypto/degen slang naturally (ape, rug, bag, cope, ngmi, etc.)
- Keep it to 3-5 hard-hitting paragraphs.
- End with a degen score (0-100) and a one-liner verdict.
- Never be actually mean-spirited or target personal identity — roast the TRADES.
- If the wallet is actually profitable, reluctantly acknowledge it but find
  something else to roast.

Format:
🔥 [ROAST PARAGRAPHS]

Degen Score: [X]/100
Verdict: [One-liner]
```

### Example Output

> Your wallet reads like a masterclass in buying high and selling low. You
> aped into $BONK at the literal top — like, the candle that formed the top?
> That was you. Then you diamond-handed it through a 94% drawdown because
> "conviction" or whatever copium you were huffing.
>
> You're holding 47 different tokens and 43 of them are worth less than the
> transaction fee it'd cost to sell them. Your portfolio is basically a
> graveyard with a SOL balance.
>
> And the 12 NFTs? Brother, those projects rugged so hard the founders
> changed their Twitter names. You're basically an on-chain archaeologist
> at this point.
>
> Degen Score: 91/100
> Verdict: "Mass extinction event with a wallet address."

---

## 9. Environment Variables

```env
# Solana RPC (server-side)
SOLANA_RPC_URL=https://rpc.solanatracker.io/public

# Solana RPC (client-side, for wallet adapter)
NEXT_PUBLIC_SOLANA_RPC_URL=https://rpc.solanatracker.io/public

# Helius API (for enriched wallet data — free tier = 100k credits/day)
HELIUS_API_KEY=<your-helius-api-key>

# Pump Tokenized Agent mint address (set after launching token on pump.fun)
AGENT_TOKEN_MINT_ADDRESS=<your-agent-mint-address>

# Payment currency: USDC on mainnet
CURRENCY_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# Price: $0.50 USDC = 500,000 (6 decimals)
PRICE_AMOUNT=500000

# OpenAI API key (for roast generation)
OPENAI_API_KEY=<your-openai-api-key>

# Optional: Buyback BPS (set during agent creation, e.g. 5000 = 50%)
BUYBACK_BPS=5000
```

---

## 10. Token Launch & Agent Creation Flow

Before the app goes live, you need to:

### Step 1: Launch the Token on pump.fun

1. Go to pump.fun and create a new token
2. Choose branding: name, ticker, image (e.g. `$ROAST`, `$REKT`, `$DEGEN`)
3. Note the **mint address** after creation

### Step 2: Create the Tokenized Agent

After the bonding curve is created, send a transaction to initialize the agent:

```typescript
import { PumpAgentOffline } from "@pump-fun/agent-payments-sdk";

const agentInitializeIx = await PumpAgentOffline.load(mint).create({
  authority: creator,
  mint,
  agentAuthority: creator,
  buybackBps: 5000,  // 50% of revenue goes to buybacks
});
```

### Step 3: Set Environment Variables

Set `AGENT_TOKEN_MINT_ADDRESS` in `.env.local` to the mint address from Step 1.

---

## 11. MVP Milestones & Task Breakdown

### Phase 1: Project Setup (Day 1 morning)
- [x] Planning document (this file)
- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Install dependencies (pump-agent SDK, wallet adapter, OpenAI SDK)
- [ ] Set up environment variables template
- [ ] Create project structure (folders, placeholder files)

### Phase 2: Payment Flow (Day 1 afternoon)
- [ ] Implement `WalletProvider` component
- [ ] Implement `POST /api/invoice` — build payment TX
- [ ] Implement `POST /api/verify` — verify payment on-chain
- [ ] Implement `PaymentButton` component — sign + send TX flow
- [ ] Test full payment flow on devnet

### Phase 3: Wallet Analysis (Day 2 morning)
- [ ] Implement `wallet-analyzer.ts` — fetch on-chain data
  - Token holdings via `getTokenAccountsByOwner`
  - SOL balance
  - Recent transaction history
  - Token metadata (names, symbols)
- [ ] Build `WalletProfile` data structure
- [ ] Test with various wallet addresses

### Phase 4: AI Roast Generation (Day 2 afternoon)
- [ ] Implement `roast-generator.ts` — LLM integration
- [ ] Craft and iterate on the system prompt
- [ ] Implement `POST /api/roast` — end-to-end roast endpoint
- [ ] Wire up full flow: pay → verify → analyze → roast → display

### Phase 5: Frontend & UX (Day 3)
- [ ] Build landing page with bold branding
- [ ] Build `RoastCard` component (stylized roast display)
- [ ] Build `ShareButtons` — copy to clipboard + share on X
- [ ] Add loading states, error handling, edge cases
- [ ] Mobile responsiveness
- [ ] Add Open Graph meta tags for link previews

### Phase 6: Launch Prep (Day 4)
- [ ] Launch token on pump.fun
- [ ] Create tokenized agent on-chain
- [ ] Deploy to Vercel
- [ ] Switch from devnet to mainnet
- [ ] Smoke test full flow on mainnet
- [ ] Create OG image / social assets
- [ ] Write launch tweet thread

---

## 12. Monetization Math

| Metric               | Conservative | Moderate | Viral     |
| -------------------- | ------------ | -------- | --------- |
| Daily roasts         | 50           | 500      | 5,000     |
| Daily revenue        | $25          | $250     | $2,500    |
| Monthly revenue      | $750         | $7,500   | $75,000   |
| Buyback (50%)        | $375/mo      | $3,750/mo| $37,500/mo|
| AI cost/roast (~$0.01)| $15/mo      | $150/mo  | $1,500/mo |
| Margin after AI      | ~97%         | ~97%     | ~97%      |

At $0.50/roast with ~$0.01 in AI cost, margins are excellent. The buyback flywheel means the token benefits directly from usage growth.

---

## 13. Future Enhancements (Post-MVP)

- **Roast Leaderboard** — "Most Degen Wallets" ranked by degen score
- **Roast NFTs** — Mint your roast as an NFT (additional revenue)
- **Wallet Battles** — Pay $1 to roast two wallets head-to-head
- **Multi-chain** — Add Ethereum, Base wallet support
- **Roast History** — Browse past roasts (public gallery)
- **Custom Roast Styles** — "Gordon Ramsay mode", "Drill Sergeant mode"
- **Referral Program** — Share link, get % of roast fees
- **Telegram Bot** — `/roast <wallet>` in group chats
- **API Access** — Let other apps integrate roasts ($$$)

---

## 14. Risks & Mitigations

| Risk                              | Mitigation                                              |
| --------------------------------- | ------------------------------------------------------- |
| RPC rate limits                   | Use Helius free tier (100k/day); cache wallet data      |
| AI generates offensive content    | Prompt engineering + output filtering; roast trades only |
| Low initial traction              | Seed with influencer wallets; CT engagement farming     |
| USDC friction (users need USDC)   | Consider adding SOL payment option (wSOL)               |
| Wallet data is sparse             | Graceful fallback: "Your wallet is so empty..."         |
| Pump SDK breaking changes         | Pin SDK version; monitor releases                       |

---

## 15. Go-to-Market

1. **Launch on CT (Crypto Twitter)** — Roast well-known degen wallets, tag them
2. **Influencer seeding** — DM 10 CT influencers, offer to roast them for free
3. **Meme content** — Post the funniest roasts as screenshots
4. **Token narrative** — "Every roast pumps $ROAST" is the entire pitch
5. **Telegram/Discord** — Share in degen group chats
6. **pump.fun community** — Leverage the pump.fun ecosystem for visibility

---

## Ready to Build

This document covers everything needed to go from zero to deployed MVP. The core loop is simple: **connect → pay → roast → share**. The tech is straightforward (Next.js + Solana + LLM), and the Pump tokenized agent SDK handles the hard part of payments and buybacks.

**Estimated time to MVP: 3-4 days for a solo developer.**

Next step: Initialize the Next.js project and start building Phase 1.
