"use client";

import { useState } from "react";
import WalletInput from "@/components/WalletInput";
import PaymentButton from "@/components/PaymentButton";
import RoastCard from "@/components/RoastCard";
import TokenInfo from "@/components/TokenInfo";
import type { RoastResult } from "@/types";

const TOKEN_CA = process.env.NEXT_PUBLIC_TOKEN_CA ?? "";

type AppState = "landing" | "payment" | "result";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
  const [walletAddress, setWalletAddress] = useState("");
  const [roastResult, setRoastResult] = useState<RoastResult | null>(null);
  const [error, setError] = useState("");

  const handleWalletReady = (address: string) => {
    setWalletAddress(address);
    setError("");
    setAppState("payment");
  };

  const handleRoastReady = (result: RoastResult) => {
    setRoastResult(result);
    setAppState("result");
  };

  const handleReset = () => {
    setAppState("landing");
    setWalletAddress("");
    setRoastResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-sm font-semibold text-white tracking-tight hover:text-zinc-300 transition-colors"
          >
            WALLET ROASTER
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-600 font-mono">0.01 SOL</span>
            <span className="text-xs text-red-400/60 font-medium">
              Tokenized Agent
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Landing */}
        {appState === "landing" && (
          <div className="w-full max-w-lg space-y-10 fade-in">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-950/30 border border-red-900/30 rounded-full">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400 font-medium">
                  Tokenized AI Agent on pump.fun
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
                Get your wallet
                <br />
                <span className="text-red-500">roasted.</span>
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed">
                Connect your wallet and pay 0.01 SOL for a savage AI roast of
                your on-chain history. Every payment flows through a tokenized
                agent that uses{" "}
                <span className="text-zinc-300 font-medium">
                  100% of revenue to buy back the token
                </span>
                .
              </p>
            </div>

            <WalletInput onWalletReady={handleWalletReady} />

            <TokenInfo ca={TOKEN_CA} />

            {/* Stats bar */}
            <div className="border-t border-[#1a1a1a] pt-8 grid grid-cols-3 gap-6">
              <div>
                <p className="text-lg font-bold text-white">0.01</p>
                <p className="text-xs text-zinc-600 mt-0.5">SOL per roast</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">100%</p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  revenue → buyback
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">GPT-4o</p>
                <p className="text-xs text-zinc-600 mt-0.5">AI powered</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        {appState === "payment" && (
          <div className="w-full max-w-lg space-y-6 fade-in">
            <div className="space-y-1">
              <button
                onClick={handleReset}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mb-4 flex items-center gap-1"
              >
                ← Back
              </button>
              <h2 className="text-xl font-bold text-white">Ready to roast</h2>
              <p className="text-sm text-zinc-500">
                Roasting wallet{" "}
                <span className="font-mono text-zinc-300">
                  {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                </span>
              </p>
            </div>

            <div className="p-4 bg-[#111] border border-[#1f1f1f] rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Service</span>
                <span className="text-white">AI Wallet Roast</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Network</span>
                <span className="text-white">Solana</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Buyback</span>
                <span className="text-red-400">100% → token</span>
              </div>
              <div className="border-t border-[#1f1f1f] pt-3 flex justify-between text-sm font-medium">
                <span className="text-zinc-400">Total</span>
                <span className="text-white">0.01 SOL</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <PaymentButton
              walletAddress={walletAddress}
              onRoastReady={handleRoastReady}
              onError={setError}
            />

            <p className="text-xs text-zinc-600 text-center">
              Payment is processed on-chain via a pump.fun tokenized agent.
              100% of revenue automatically buys back the token.
            </p>
          </div>
        )}

        {/* Result */}
        {appState === "result" && roastResult && (
          <div className="w-full max-w-2xl fade-in">
            <div className="mb-8">
              <button
                onClick={handleReset}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
              >
                ← Roast another wallet
              </button>
            </div>
            <RoastCard result={roastResult} walletAddress={walletAddress} />
          </div>
        )}
      </main>

      <footer className="border-t border-[#1a1a1a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-xs text-zinc-700">
            Tokenized AI agent — roasting trades, not people.
          </p>
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors font-mono"
          >
            Built on Solana + pump.fun
          </a>
        </div>
      </footer>
    </div>
  );
}
