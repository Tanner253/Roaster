# Wallet Roaster

Pay $0.50 USDC to get your Solana wallet roasted by AI. Every fee buys back $TOKEN via a Pump tokenized agent.

## Prerequisites

- Node.js 18+
- A pump.fun token (mint address)
- An initialized Pump tokenized agent (see below)
- OpenAI API key (GPT-4o)
- Helius API key (free tier at [helius.dev](https://helius.dev) — 100k credits/day)
- A Solana wallet with USDC for testing

## Setup

### 1. Launch your token on pump.fun

Go to [pump.fun](https://pump.fun), create a new token, and note the **mint address** after creation.

### 2. Initialize the tokenized agent on-chain

```bash
npx tsx scripts/init-agent.ts <MINT_ADDRESS> <KEYPAIR_PATH> [BUYBACK_BPS]
```

Example with 50% buyback:

```bash
npx tsx scripts/init-agent.ts AbC123...xyz ~/.config/solana/id.json 5000
```

This registers your token as a Pump tokenized agent so it can accept payments and auto-buyback.

### 3. Create `.env.local`

```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=<your-helius-api-key>
AGENT_TOKEN_MINT_ADDRESS=<your-mint-address>
CURRENCY_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
PRICE_AMOUNT=500000
OPENAI_API_KEY=<your-openai-api-key>
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

You need a Phantom or Solflare wallet with at least $0.50 USDC on Solana mainnet. The pump.fun SDK is mainnet-only — there's no devnet path.

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables from `.env.local` in the Vercel dashboard under **Settings > Environment Variables**.

## Tech Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- **@pump-fun/agent-payments-sdk** — payment invoices + verification
- **@solana/wallet-adapter-react** — Phantom, Solflare wallet connection
- **Helius DAS API** — enriched token data, NFTs, balances
- **OpenAI GPT-4o** — roast generation

## How It Works

1. User connects wallet or pastes any Solana address
2. User pays $0.50 USDC (transaction built server-side, signed client-side)
3. Server verifies payment on-chain via Pump SDK
4. Server fetches wallet data (tokens, SOL balance, trade history, NFTs)
5. GPT-4o generates a personalized roast based on on-chain activity
6. User gets their roast with a degen score, stats, and share buttons
