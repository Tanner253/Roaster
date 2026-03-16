import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PumpAgentOffline } from "@pump-fun/agent-payments-sdk";
import * as fs from "fs";

const USAGE = `
Usage: npx tsx scripts/init-agent.ts <MINT_ADDRESS> <KEYPAIR_PATH> [BUYBACK_BPS]

  MINT_ADDRESS   The pump.fun token mint address
  KEYPAIR_PATH   Path to Solana keypair JSON file (creator/authority wallet)
  BUYBACK_BPS    Buyback basis points (default: 5000 = 50%)

Example:
  npx tsx scripts/init-agent.ts AbC123...xyz ~/.config/solana/id.json 5000
`;

async function main() {
  const [, , mintArg, keypairPath, bpsArg] = process.argv;

  if (!mintArg || !keypairPath) {
    console.log(USAGE);
    process.exit(1);
  }

  const mint = new PublicKey(mintArg);
  const buybackBps = Number(bpsArg ?? "10000");

  if (buybackBps < 0 || buybackBps > 10000) {
    console.error("BUYBACK_BPS must be between 0 and 10000");
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const creator = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log(`Mint:          ${mint.toBase58()}`);
  console.log(`Authority:     ${creator.publicKey.toBase58()}`);
  console.log(`Buyback BPS:   ${buybackBps} (${buybackBps / 100}%)`);
  console.log();

  const rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("Building agent initialization instruction...");
  const agent = PumpAgentOffline.load(mint);
  const initIx = await agent.create({
    authority: creator.publicKey,
    mint,
    agentAuthority: creator.publicKey,
    buybackBps,
  });

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction();
  tx.add(initIx);
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = creator.publicKey;

  console.log("Sending transaction...");
  const signature = await sendAndConfirmTransaction(connection, tx, [creator], {
    commitment: "confirmed",
  });

  console.log();
  console.log("Agent initialized successfully!");
  console.log(`Signature: ${signature}`);
  console.log(`Explorer:  https://solscan.io/tx/${signature}`);
  console.log();
  console.log("Next step: set AGENT_TOKEN_MINT_ADDRESS in .env.local:");
  console.log(`  AGENT_TOKEN_MINT_ADDRESS=${mint.toBase58()}`);
}

main().catch((err) => {
  console.error("Failed to initialize agent:", err);
  process.exit(1);
});
