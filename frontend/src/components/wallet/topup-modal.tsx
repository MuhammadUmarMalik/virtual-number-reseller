"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/use-wallet";
import { ApiError } from "@/lib/api-client";
import {
  createTopupSchema,
  type CreateTopupFormValues,
} from "@/schemas/topup.schema";
import { createTopup, getPaymentAccounts } from "@/services/topup.service";

interface TopupModalProps {
  onClose: () => void;
}

export function TopupModal({ onClose }: TopupModalProps) {
  const { invalidate } = useWallet();
  const [serverError, setServerError] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: getPaymentAccounts,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTopupFormValues>({
    resolver: zodResolver(createTopupSchema),
    defaultValues: {
      paymentAccountId: "",
      amount: undefined,
      senderAccount: "",
      transactionId: "",
      notes: "",
    },
  });

  const submitForm: SubmitHandler<CreateTopupFormValues> = async (values) => {
    setServerError(null);
    try {
      const result = await createTopup({
        paymentAccountId: values.paymentAccountId,
        amount: values.amount,
        senderAccount: values.senderAccount,
        transactionId: values.transactionId,
        notes: values.notes,
      });
      setWhatsappUrl(result.whatsappUrl);
      reset();
      void invalidate();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Unable to submit top-up request. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Top Up Wallet</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {whatsappUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Your top-up request has been submitted. Send the payment details to
              our admin on WhatsApp so we can approve it quickly.
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="w-full"
                onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
              >
                Open WhatsApp
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="paymentAccountId">Payment Method</Label>
              {accountsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading payment methods...</p>
              ) : (
                <select
                  id="paymentAccountId"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                  disabled={isSubmitting}
                  {...register("paymentAccountId")}
                >
                  <option value="">Select a method</option>
                  {accountsQuery.data?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.title} ({account.accountNumber})
                    </option>
                  ))}
                </select>
              )}
              {errors.paymentAccountId?.message && (
                <p className="text-sm text-red-600">{errors.paymentAccountId.message}</p>
              )}
            </div>

            <FormField
              label="Amount (PKR)"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Enter amount"
              disabled={isSubmitting}
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />
            <FormField
              label="Sender Account"
              type="text"
              placeholder="Account you sent payment from"
              disabled={isSubmitting}
              error={errors.senderAccount?.message}
              {...register("senderAccount")}
            />
            <FormField
              label="Transaction ID"
              type="text"
              placeholder="Optional transaction ID"
              disabled={isSubmitting}
              error={errors.transactionId?.message}
              {...register("transactionId")}
            />
            <FormField
              label="Notes"
              type="text"
              placeholder="Optional notes"
              disabled={isSubmitting}
              error={errors.notes?.message}
              {...register("notes")}
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
              disabled={accountsQuery.isLoading}
            >
              Submit Request
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
