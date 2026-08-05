"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ApiError } from "@/lib/api-client";
import {
  createRefundSchema,
  type CreateRefundFormValues,
} from "@/schemas/order.schema";
import { createRefund } from "@/services/refund.service";

interface RefundModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RefundModal({ orderId, onClose, onSuccess }: RefundModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRefundFormValues>({
    resolver: zodResolver(createRefundSchema),
    defaultValues: { reason: "" },
  });

  const submitForm: SubmitHandler<CreateRefundFormValues> = async (values) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await createRefund(orderId, values.reason);
      reset();
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Unable to submit refund request. Please try again."
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
          <h2 className="text-lg font-semibold text-slate-900">Request Refund</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}
          <FormField
            label="Reason"
            type="text"
            placeholder="Explain why you want a refund"
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register("reason")}
          />
          <Button type="submit" variant="danger" className="w-full" isLoading={isSubmitting}>
            Submit Refund Request
          </Button>
        </form>
      </div>
    </div>
  );
}
