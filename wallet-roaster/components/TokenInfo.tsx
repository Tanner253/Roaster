"use client";

import { FC, useState } from "react";

interface TokenInfoProps {
  ca: string;
}

const TokenInfo: FC<TokenInfoProps> = ({ ca }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!ca) return;
    await navigator.clipboard.writeText(ca);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* CA display */}
      {ca && (
        <div className="p-4 bg-[#111] border border-[#1f1f1f] rounded-lg">
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">
            Contract Address
          </p>
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between gap-3 group"
          >
            <span className="font-mono text-sm text-zinc-300 truncate">
              {ca}
            </span>
            <span className="shrink-0 text-xs text-zinc-600 group-hover:text-zinc-300 transition-colors">
              {copied ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>
      )}

      {/* How agent tokenization works */}
      <div className="p-5 bg-[#111] border border-[#1f1f1f] rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-white">
          How Agent Tokenization Works
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          This app is a{" "}
          <span className="text-white font-medium">tokenized AI agent</span>{" "}
          built on{" "}
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
          >
            pump.fun
          </a>
          . Every payment made for a roast flows through an on-chain program
          that automatically uses 100% of revenue to buy back the token.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Step number="1" label="Pay" desc="0.01 SOL per roast" />
          <Step number="2" label="Roast" desc="AI analyzes your wallet" />
          <Step number="3" label="Buyback" desc="100% buys back the token" />
        </div>
      </div>
    </div>
  );
};

function Step({
  number,
  label,
  desc,
}: {
  number: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="text-center space-y-1.5">
      <div className="mx-auto w-7 h-7 rounded-full bg-red-950/40 border border-red-900/30 flex items-center justify-center">
        <span className="text-xs font-bold text-red-400">{number}</span>
      </div>
      <p className="text-xs font-semibold text-white">{label}</p>
      <p className="text-[11px] text-zinc-500 leading-tight">{desc}</p>
    </div>
  );
}

export default TokenInfo;
