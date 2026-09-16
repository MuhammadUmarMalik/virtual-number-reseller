"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  createPaymentAccount,
  updatePaymentAccount,
} from "@/services/admin.service";
import type { PaymentAccount } from "@/types/wallet.types";

const paymentAccountSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  accountName: z.string().trim().min(2, "Account name is required"),
  accountNumber: z.string().trim().min(4, "Account number is required"),
  paymentMethod: z.enum(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER"]),
  instructions: z.string().trim().max(500).optional(),
});

type PaymentAccountFormValues = z.infer<typeof paymentAccountSchema>;

interface PaymentAccountFormModalProps {
  account: PaymentAccount | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentAccountFormModal({
  account,
  onClose,
  onSuccess,
}: PaymentAccountFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentAccountFormValues>({
    resolver: zodResolver(paymentAccountSchema),
    defaultValues: account
      ? {
          title: account.title,
          accountName: account.accountName,
          accountNumber: account.accountNumber,
          paymentMethod: account.paymentMethod,
          instructions: account.instructions ?? "",
        }
      : {
          title: "",
          accountName: "",
          accountNumber: "",
          paymentMethod: "EASYPAISA",
          instructions: "",
        },
  });

  const submitForm: SubmitHandler<PaymentAccountFormValues> = async (values) => {
    setServerError(null);
    try {
      if (account) {
        await updatePaymentAccount(account.id, values);
        toast.success("Payment account updated");
      } else {
        await createPaymentAccount(values);
        toast.success("Payment account created");
      }
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to save payment account";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal
      title={account ? "Edit Payment Account" : "Add Payment Account"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            {serverError}
          </div>
        )}
        <FormField
          label="Title"
          type="text"
          placeholder="Easypaisa Wallet"
          error={errors.title?.message}
          disabled={isSubmitting}
          {...register("title")}
        />
        <FormField
          label="Account Name"
          type="text"
          placeholder="Number Reseller PVT"
          error={errors.accountName?.message}
          disabled={isSubmitting}
          {...register("accountName")}
        />
        <FormField
          label="Account Number"
          type="text"
          placeholder="0317-1600808"
          error={errors.accountNumber?.message}
          disabled={isSubmitting}
          {...register("accountNumber")}
        />
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            id="paymentMethod"
            disabled={isSubmitting}
            {...register("paymentMethod")}
          >
            <option value="EASYPAISA">Easypaisa</option>
            <option value="JAZZCASH">JazzCash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </Select>
          {errors.paymentMethod?.message && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.paymentMethod.message}
            </p>
          )}
        </div>
        <FormField
          label="Instructions (optional)"
          type="text"
          placeholder="Send payment and share your transaction ID."
          error={errors.instructions?.message}
          disabled={isSubmitting}
          {...register("instructions")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          {account ? "Save Changes" : "Create Account"}
        </Button>
      </form>
    </Modal>
  );
}