"use client";

import { FC, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import type { InvoiceParams, RoastResult } from "@/types";

interface PaymentButtonProps {
  walletAddress: string;
  onRoastReady: (result: RoastResult) => void;
  onError: (message: string) => void;
}

type Stage =
  | "idle"
  | "generating_invoice"
  | "awaiting_signature"
  | "verifying"
  | "roasting"
  | "done";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Pay $0.50 to Get Roasted",
  generating_invoice: "Preparing transaction...",
  awaiting_signature: "Approve in wallet...",
  verifying: "Confirming payment...",
  roasting: "AI is judging you...",
  done: "Done",
};

const PaymentButton: FC<PaymentButtonProps> = ({
  walletAddress,
  onRoastReady,
  onError,
}) => {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [stage, setStage] = useState<Stage>("idle");

  const handlePay = useCallback(async () => {
    if (stage !== "idle") return;

    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    try {
      setStage("generating_invoice");

      const invoiceRes = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!invoiceRes.ok) {
        throw new Error("Failed to generate invoice");
      }

      const { transaction: txBase64, invoice } = (await invoiceRes.json()) as {
        transaction: string;
        invoice: InvoiceParams;
      };

      setStage("awaiting_signature");

      const tx = Transaction.from(Buffer.from(txBase64, "base64"));
      const signedTx = await signTransaction(tx);

      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        { skipPreflight: false, preflightCommitment: "confirmed" }
      );

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );

      setStage("verifying");

      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, ...invoice }),
      });

      const { verified } = (await verifyRes.json()) as { verified: boolean };

      if (!verified) {
        throw new Error(
          "Payment could not be verified. Please wait a moment and try again."
        );
      }

      setStage("roasting");

      const roastRes = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, ...invoice }),
      });

      if (!roastRes.ok) {
        throw new Error("Failed to generate roast");
      }

      const result = (await roastRes.json()) as RoastResult;
      setStage("done");
      onRoastReady(result);
    } catch (err: unknown) {
      setStage("idle");
      console.error("[PaymentButton] full error:", err);

      let message = "Something went wrong";
      if (err instanceof Error) {
        message = err.message;
        if (err.name === "WalletSignTransactionError") {
          message =
            "Phantom rejected the transaction. Make sure you have enough USDC ($0.50) and SOL for fees in your wallet, and that you are on walletroast.fun (not a .vercel.app URL).";
        }
      }
      onError(message);
    }
  }, [
    stage,
    walletAddress,
    publicKey,
    signTransaction,
    connected,
    connection,
    setVisible,
    onRoastReady,
    onError,
  ]);

  const isLoading = stage !== "idle" && stage !== "done";

  return (
    <button
      onClick={handlePay}
      disabled={isLoading}
      className={`w-full max-w-lg py-4 text-sm font-semibold rounded-lg transition-all ${
        isLoading
          ? "bg-[#111] border border-[#1f1f1f] text-zinc-500 cursor-not-allowed"
          : "bg-red-600 hover:bg-red-500 text-white cursor-pointer"
      }`}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          {STAGE_LABELS[stage]}
        </span>
      ) : (
        STAGE_LABELS[stage]
      )}
    </button>
  );
};

export default PaymentButton;
