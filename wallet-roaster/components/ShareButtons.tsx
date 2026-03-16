"use client";

import { FC, useState } from "react";

interface ShareButtonsProps {
  roast: string;
  walletAddress: string;
}

const ShareButtons: FC<ShareButtonsProps> = ({ roast, walletAddress }) => {
  const [copied, setCopied] = useState(false);

  const tweetText = encodeURIComponent(
    `I just got absolutely rekt by the Wallet Roaster AI 🔥\n\n${roast.slice(0, 200)}...\n\nGet your wallet roasted 👇`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roast);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // walletAddress is available for future use (e.g. deeplink to wallet explorer)
  void walletAddress;

  return (
    <div className="flex gap-3">
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 py-3 bg-[#111] border border-[#1f1f1f] text-white text-sm font-medium rounded-lg hover:border-zinc-600 hover:bg-[#161616] transition-all text-center"
      >
        Share on X
      </a>
      <button
        onClick={handleCopy}
        className="flex-1 py-3 bg-[#111] border border-[#1f1f1f] text-white text-sm font-medium rounded-lg hover:border-zinc-600 hover:bg-[#161616] transition-all"
      >
        {copied ? "Copied!" : "Copy Roast"}
      </button>
    </div>
  );
};

export default ShareButtons;
