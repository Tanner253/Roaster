"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface WalletInputProps {
  onWalletReady: (address: string) => void;
}

function truncate(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const WalletInput: FC<WalletInputProps> = ({ onWalletReady }) => {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [target, setTarget] = useState<"self" | "other">("self");
  const [otherAddress, setOtherAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [target]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleRoast = () => {
    setError("");

    if (!connected || !publicKey) {
      setError("Connect your wallet first to pay for the roast");
      return;
    }

    if (target === "self") {
      onWalletReady(publicKey.toBase58());
    } else {
      const trimmed = otherAddress.trim();
      if (!trimmed || trimmed.length < 32 || trimmed.length > 44) {
        setError("Enter a valid Solana wallet address");
        return;
      }
      onWalletReady(trimmed);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Step 1: Connect wallet (required for payment) */}
      {!connected || !publicKey ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Connect your wallet to pay for the roast.
          </p>
          <button
            onClick={handleConnect}
            className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected wallet display */}
          <div className="flex items-center justify-between p-4 bg-[#111] border border-[#1f1f1f] rounded-lg">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Connected</p>
              <p className="font-mono text-sm text-white">
                {truncate(publicKey.toBase58())}
              </p>
            </div>
            <button
              onClick={() => disconnect()}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Disconnect
            </button>
          </div>

          {/* Step 2: Choose who to roast */}
          <div className="flex gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-lg">
            <button
              onClick={() => setTarget("self")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                target === "self"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Roast My Wallet
            </button>
            <button
              onClick={() => setTarget("other")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                target === "other"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Roast Another
            </button>
          </div>

          {target === "other" && (
            <input
              type="text"
              placeholder="Enter Solana wallet address..."
              value={otherAddress}
              onChange={(e) => setOtherAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRoast()}
              className="w-full p-4 bg-[#111] border border-[#1f1f1f] rounded-lg font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleRoast}
            className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {target === "self"
              ? "Roast My Wallet"
              : "Roast This Wallet"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletInput;
