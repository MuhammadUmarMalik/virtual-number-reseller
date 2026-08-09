"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
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
        toast.success("Wallet credited");
      } else {
        await debitUserWallet(userId, numericAmount, reason.trim());
        toast.success("Wallet debited");
      }
      onSuccess();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Unable to adjust wallet";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Adjust Wallet" onClose={onClose}>
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
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <Input
            id="amount"
            type="number"
            inputMode="numeric"
            min={1}
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
    </Modal>
  );
}
