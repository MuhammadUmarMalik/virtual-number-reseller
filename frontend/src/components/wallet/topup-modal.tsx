"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Building2, X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useWallet } from "@/hooks/use-wallet";
import { ApiError } from "@/lib/api-client";
import {
  createTopupSchema,
  type CreateTopupFormValues,
} from "@/schemas/topup.schema";
import { createTopup, getPaymentAccounts } from "@/services/topup.service";

const TOPUP_WHATSAPP_NUMBER = "03062617205";

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

  const account =
    accountsQuery.data?.find((acc) => acc.isActive) ??
    accountsQuery.data?.[0] ??
    null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTopupFormValues>({
    resolver: zodResolver(createTopupSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const submitForm: SubmitHandler<CreateTopupFormValues> = async (values) => {
    setServerError(null);

    if (!account) {
      setServerError("No payment account available. Please try again later.");
      return;
    }

    try {
      const result = await createTopup({
        paymentAccountId: account.id,
        amount: values.amount,
      });
      setWhatsappUrl(result.whatsappUrl);
      reset();
      void invalidate();
      toast.success("Top-up request submitted");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to submit top-up request. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card text-card-foreground shadow-xl sm:max-w-md sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Top Up Wallet</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {whatsappUrl ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                Your top-up request has been submitted. Send the payment details
                to our admin on WhatsApp so we can approve it quickly.
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() =>
                    window.open(whatsappUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  Open WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(submitForm)}
              className="space-y-4"
              noValidate
            >
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                >
                  {serverError}
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {accountsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading payment details...
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold">
                          {account?.title ?? "Easypaisa Wallet"}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Account Name:{" "}
                          <span className="font-medium text-foreground">
                            {account?.accountName ?? "—"}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Account Number:{" "}
                          <span className="font-mono font-medium text-foreground">
                            {account?.accountNumber ?? "—"}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          WhatsApp:{" "}
                          <span className="font-mono font-medium text-foreground">
                            {TOPUP_WHATSAPP_NUMBER}
                          </span>
                        </p>
                        {account?.instructions && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            {account.instructions}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
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

              <Button
                type="submit"
                className="w-full"
                isLoading={isSubmitting}
                disabled={accountsQuery.isLoading || !account}
              >
                Submit Request
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
