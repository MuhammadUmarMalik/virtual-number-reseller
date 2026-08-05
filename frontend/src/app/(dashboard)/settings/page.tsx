"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { ApiError } from "@/lib/api-client";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordFormValues,
  type UpdateProfileFormValues,
} from "@/schemas/settings.schema";
import { changePassword, updateProfile } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const profileForm = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      email: user?.email ?? "",
      whatsappNumber: user?.whatsappNumber ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const submitProfile: SubmitHandler<UpdateProfileFormValues> = async (values) => {
    setProfileError(null);
    try {
      const updated = await updateProfile(values);
      if (user && accessToken) {
        setAuth(updated, accessToken);
      }
      toast.success("Profile updated");
    } catch (error) {
      setProfileError(
        error instanceof ApiError
          ? error.message
          : "Unable to update profile. Please try again."
      );
    }
  };

  const submitPassword: SubmitHandler<ChangePasswordFormValues> = async (values) => {
    setPasswordError(null);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success("Password changed");
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : "Unable to change password. Please try again."
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile</h2>
        <form
          onSubmit={profileForm.handleSubmit(submitProfile)}
          className="space-y-4"
          noValidate
        >
          {profileError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {profileError}
            </div>
          )}
          <FormField
            label="Full Name"
            type="text"
            autoComplete="name"
            error={profileForm.formState.errors.fullName?.message}
            disabled={profileForm.formState.isSubmitting}
            {...profileForm.register("fullName")}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            error={profileForm.formState.errors.email?.message}
            disabled={profileForm.formState.isSubmitting}
            {...profileForm.register("email")}
          />
          <FormField
            label="WhatsApp Number"
            type="tel"
            autoComplete="tel"
            error={profileForm.formState.errors.whatsappNumber?.message}
            disabled={profileForm.formState.isSubmitting}
            {...profileForm.register("whatsappNumber")}
          />
          <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
            Save Profile
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Change Password
        </h2>
        <form
          onSubmit={passwordForm.handleSubmit(submitPassword)}
          className="space-y-4"
          noValidate
        >
          {passwordError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {passwordError}
            </div>
          )}
          <FormField
            label="Current Password"
            type="password"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
            disabled={passwordForm.formState.isSubmitting}
            {...passwordForm.register("currentPassword")}
          />
          <FormField
            label="New Password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.newPassword?.message}
            disabled={passwordForm.formState.isSubmitting}
            {...passwordForm.register("newPassword")}
          />
          <FormField
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            disabled={passwordForm.formState.isSubmitting}
            {...passwordForm.register("confirmPassword")}
          />
          <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>
            Change Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
