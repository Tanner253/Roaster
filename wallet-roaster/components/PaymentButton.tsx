"use client";

import { FC, useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
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
  const { signTransaction, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [stage, setStage] = useState<Stage>("idle");

  const handlePay = useCallback(async () => {
    if (stage !== "idle") return;

    try {
      setStage("generating_invoice");

      // 1. Generate invoice + unsigned TX
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

      // 2. Deserialize + sign TX
      const txBytes = Buffer.from(txBase64, "base64");
      let tx: Transaction | VersionedTransaction;

      try {
        tx = VersionedTransaction.deserialize(txBytes);
      } catch {
        tx = Transaction.from(txBytes);
      }

      if (!signTransaction) throw new Error("Wallet does not support signing");

      const signed = await signTransaction(tx as Transaction);

      // 3. Send TX on-chain
      const signature = await sendTransaction(
        signed as Transaction,
        connection
      );

      await connection.confirmTransaction(signature, "confirmed");

      setStage("verifying");

      // 4. Verify payment server-side
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

      // 5. Generate roast
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
    } catch (err) {
      setStage("idle");
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      onError(message);
    }
  }, [
    stage,
    walletAddress,
    signTransaction,
    sendTransaction,
    connection,
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
