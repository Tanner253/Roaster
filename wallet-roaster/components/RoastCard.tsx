"use client";

import { FC } from "react";
import type { RoastResult } from "@/types";
import ShareButtons from "./ShareButtons";

interface RoastCardProps {
  result: RoastResult;
  walletAddress: string;
}

const RoastCard: FC<RoastCardProps> = ({ result, walletAddress }) => {
  const truncated = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  const paragraphs = result.roast.split("\n\n").filter(Boolean);

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-zinc-500 font-mono mb-1">{truncated}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white">Degen Score</span>
            <span className="text-2xl font-bold text-red-500">
              {result.stats.degenScore}/100
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 mb-1">Degen Profile</p>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-lg font-bold text-white">
                {result.stats.tokensHeld}
              </p>
              <p className="text-xs text-zinc-500">tokens</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {result.stats.rugCount}
              </p>
              <p className="text-xs text-zinc-500">rugs</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white font-mono truncate max-w-[80px]">
                ${result.stats.biggestBag}
              </p>
              <p className="text-xs text-zinc-500">biggest bag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#1f1f1f] mb-6" />

      {/* Roast text */}
      <div className="space-y-4 mb-8">
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className={`text-sm leading-relaxed ${
              paragraph.startsWith("Verdict:")
                ? "text-zinc-300 font-medium border-l-2 border-red-600 pl-4"
                : "text-zinc-400"
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Share buttons */}
      <ShareButtons roast={result.roast} walletAddress={walletAddress} />
    </div>
  );
};

export default RoastCard;
