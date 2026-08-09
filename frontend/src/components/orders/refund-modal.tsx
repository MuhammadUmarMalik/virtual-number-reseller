"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
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
      toast.success("Refund request submitted");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to submit refund request. Please try again.";
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title="Request Refund" onClose={onClose}>
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
          label="Reason"
          type="text"
          placeholder="Explain why you want a refund"
          disabled={isSubmitting}
          error={errors.reason?.message}
          {...register("reason")}
        />
        <Button
          type="submit"
          variant="danger"
          className="w-full"
          isLoading={isSubmitting}
        >
          Submit Refund Request
        </Button>
      </form>
    </Modal>
  );
}
