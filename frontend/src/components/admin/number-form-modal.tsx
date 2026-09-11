"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import {
  updateAdminNumber,
  type AdminPurchasedNumber,
  type UpdateAdminNumberPayload,
} from "@/services/admin.service";

const numberSchema = z.object({
  phoneNumber: z.string().trim().min(5, "Phone number is required"),
  status: z.enum(["WAITING", "ACTIVE", "RECEIVED", "EXPIRED", "REFUNDED", "DISABLED"]),
  expiresAt: z.string(),
  vendorOrderId: z.string().trim().optional(),
  vendorOperator: z.string().trim().optional(),
  canGetAnotherSms: z.boolean(),
  otpCount: z.number().int().min(0),
});

type NumberFormValues = z.infer<typeof numberSchema>;

function toDatetimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

interface NumberFormModalProps {
  number: AdminPurchasedNumber;
  onClose: () => void;
  onSuccess: () => void;
}

export function NumberFormModal({ number, onClose, onSuccess }: NumberFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NumberFormValues>({
    resolver: zodResolver(numberSchema),
    defaultValues: {
      phoneNumber: number.phoneNumber,
      status: number.status,
      expiresAt: toDatetimeLocal(number.expiresAt),
      vendorOrderId: number.vendorOrderId ?? "",
      vendorOperator: number.vendorOperator ?? "",
      canGetAnotherSms: number.canGetAnotherSms ?? false,
      otpCount: number.otpCount,
    },
  });

  const submitForm: SubmitHandler<NumberFormValues> = async (values) => {
    setServerError(null);
    try {
      const payload: UpdateAdminNumberPayload = {
        phoneNumber: values.phoneNumber,
        status: values.status,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
        vendorOrderId: values.vendorOrderId || null,
        vendorOperator: values.vendorOperator || null,
        canGetAnotherSms: values.canGetAnotherSms,
        otpCount: values.otpCount,
      };
      await updateAdminNumber(number.id, payload);
      toast.success("Number updated");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to update number";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal title="Edit Number" onClose={onClose} maxWidth="md">
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
          label="Phone Number"
          type="text"
          error={errors.phoneNumber?.message}
          disabled={isSubmitting}
          {...register("phoneNumber")}
        />
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" disabled={isSubmitting} {...register("status")}>
            <option value="WAITING">Waiting</option>
            <option value="ACTIVE">Active</option>
            <option value="RECEIVED">Received</option>
            <option value="EXPIRED">Expired</option>
            <option value="REFUNDED">Refunded</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Expires At"
            type="datetime-local"
            error={errors.expiresAt?.message}
            disabled={isSubmitting}
            {...register("expiresAt")}
          />
          <FormField
            label="Vendor Order ID"
            type="text"
            error={errors.vendorOrderId?.message}
            disabled={isSubmitting}
            {...register("vendorOrderId")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Vendor Operator"
            type="text"
            error={errors.vendorOperator?.message}
            disabled={isSubmitting}
            {...register("vendorOperator")}
          />
          <FormField
            label="OTP Count"
            type="number"
            inputMode="numeric"
            error={errors.otpCount?.message}
            disabled={isSubmitting}
            {...register("otpCount", { valueAsNumber: true })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <Checkbox disabled={isSubmitting} {...register("canGetAnotherSms")} />
          Can get another SMS
        </label>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}