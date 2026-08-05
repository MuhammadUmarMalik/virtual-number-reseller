"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { creditUserWallet, debitUserWallet } from "@/services/admin.service";

interface WalletAdjustModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function WalletAdjustModal({
  userId,
  onClose,
  onSuccess,
}: WalletAdjustModalProps) {
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is required for wallet adjustments");
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "credit") {
        await creditUserWallet(userId, numericAmount, reason.trim());
      } else {
        await debitUserWallet(userId, numericAmount, reason.trim());
      }
      onSuccess();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to adjust wallet"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Adjust Wallet
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={type === "credit" ? "primary" : "outline"}
            onClick={() => setType("credit")}
          >
            Credit
          </Button>
          <Button
            type="button"
            variant={type === "debit" ? "danger" : "outline"}
            onClick={() => setType("debit")}
          >
            Debit
          </Button>
        </div>

        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (PKR)</Label>
            <input
              id="amount"
              type="number"
              inputMode="numeric"
              min={1}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <FormField
            label="Reason"
            type="text"
            placeholder="Required for audit log"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant={type === "debit" ? "danger" : "primary"}
            className="w-full"
            isLoading={isSubmitting}
            onClick={() => void submit()}
          >
            {type === "credit" ? "Credit Wallet" : "Debit Wallet"}
          </Button>
        </div>
      </div>
    </div>
  );
}
