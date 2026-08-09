"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import {
  signUpSchema,
  type SignUpFormValues,
} from "@/schemas/auth.schema";
import type { SignUpPayload } from "@/types/auth.types";

export default function SignUpPage() {
  const { signUp, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    setError,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const submitForm: SubmitHandler<SignUpFormValues> = async (values) => {
    clearErrors("root");

    const payload: SignUpPayload = {
      fullName: values.fullName,
      email: values.email,
      whatsappNumber: values.whatsappNumber,
      password: values.password,
    };

    try {
      await signUp(payload);
      toast.success("Account created successfully");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create your account. Please try again.";
      setError("root.server", {
        type: "server",
        message,
      });
      toast.error(message);
    }
  };

  const isPending = isLoading || isSubmitting;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start buying virtual numbers today"
    >
      <form
        onSubmit={handleSubmit(submitForm)}
        className="space-y-4"
        noValidate
        aria-busy={isPending}
      >
        {errors.root?.server?.message && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
          >
            {errors.root.server.message}
          </div>
        )}
        <FormField
          label="Full Name"
          type="text"
          placeholder="John Doe"
          autoComplete="name"
          disabled={isPending}
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isPending}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="WhatsApp Number"
          type="tel"
          placeholder="+15551234567"
          autoComplete="tel"
          inputMode="tel"
          disabled={isPending}
          error={errors.whatsappNumber?.message}
          {...register("whatsappNumber")}
        />
        <FormField
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          disabled={isPending}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
