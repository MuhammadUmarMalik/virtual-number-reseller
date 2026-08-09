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
  signInSchema,
  type SignInFormValues,
} from "@/schemas/auth.schema";

export default function SignInPage() {
  const { signIn, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    clearErrors,
    setError,
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const submitForm: SubmitHandler<SignInFormValues> = async (values) => {
    clearErrors("root");

    try {
      await signIn(values);
      toast.success("Signed in successfully");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to sign in. Please try again.";
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
      title="Sign in to your account"
      subtitle="Enter your credentials to access your dashboard"
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
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          disabled={isPending}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormField
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          disabled={isPending}
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isPending}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
