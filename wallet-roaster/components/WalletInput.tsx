"use client";

import { FC, useState } from "react";
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
  const [manualAddress, setManualAddress] = useState("");
  const [mode, setMode] = useState<"connect" | "manual">("connect");
  const [error, setError] = useState("");

  const handleConnectClick = () => {
    if (connected && publicKey) {
      onWalletReady(publicKey.toBase58());
    } else {
      setVisible(true);
    }
  };

  const handleManualSubmit = () => {
    setError("");
    const trimmed = manualAddress.trim();
    if (!trimmed || trimmed.length < 32 || trimmed.length > 44) {
      setError("Enter a valid Solana wallet address");
      return;
    }
    onWalletReady(trimmed);
  };

  return (
    <div className="w-full max-w-lg space-y-4">
      <div className="flex gap-2 p-1 bg-[#111] border border-[#1f1f1f] rounded-lg">
        <button
          onClick={() => setMode("connect")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "connect"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Connect Wallet
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            mode === "manual"
              ? "bg-white text-black"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Paste Address
        </button>
      </div>

      {mode === "connect" ? (
        <div className="space-y-3">
          {connected && publicKey ? (
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
          ) : (
            <p className="text-sm text-zinc-500 text-center py-2">
              No wallet connected
            </p>
          )}
          <button
            onClick={handleConnectClick}
            className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {connected && publicKey ? "Roast My Wallet" : "Connect Wallet"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter Solana wallet address..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            className="w-full p-4 bg-[#111] border border-[#1f1f1f] rounded-lg font-mono text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleManualSubmit}
            className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Roast This Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletInput;
