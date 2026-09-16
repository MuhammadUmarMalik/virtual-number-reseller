"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api-client";
import { updateAdminUser } from "@/services/admin.service";
import type { AuthUser } from "@/types/auth.types";

const userProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email is required"),
  whatsappNumber: z.string().trim().min(5, "WhatsApp number is required"),
  avatarUrl: z.string().trim().url("Avatar URL must be valid").optional().or(z.literal("")),
});

type UserProfileFormValues = z.infer<typeof userProfileSchema>;

interface UserEditModalProps {
  user: AuthUser;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserEditModal({ user, onClose, onSuccess }: UserEditModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      avatarUrl: user.avatarUrl ?? "",
    },
  });

  const submitForm: SubmitHandler<UserProfileFormValues> = async (values) => {
    setServerError(null);
    try {
      await updateAdminUser(user.id, values);
      toast.success("User profile updated");
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to update user profile";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal title={`Edit ${user.fullName}`} onClose={onClose} maxWidth="md">
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
          label="Full Name"
          type="text"
          error={errors.fullName?.message}
          disabled={isSubmitting}
          {...register("fullName")}
        />
        <FormField
          label="Email"
          type="email"
          error={errors.email?.message}
          disabled={isSubmitting}
          {...register("email")}
        />
        <FormField
          label="WhatsApp Number"
          type="text"
          error={errors.whatsappNumber?.message}
          disabled={isSubmitting}
          {...register("whatsappNumber")}
        />
        <FormField
          label="Avatar URL"
          type="text"
          error={errors.avatarUrl?.message}
          disabled={isSubmitting}
          {...register("avatarUrl")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}