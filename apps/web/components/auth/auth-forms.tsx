"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import {
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  registerSchema
} from "@number-reseller/validation";
import { apiRequest, safeRedirect } from "@/lib/api";
import { FormError, FormField, PasswordStrength, SubmitButton } from "./fields";

const registrationFormSchema = registerSchema
  .omit({ termsAccepted: true })
  .extend({
    termsAccepted: z.boolean().refine(Boolean, "Accept the terms and acceptable-use policy."),
    confirmPassword: z.string()
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });
type Registration = z.infer<typeof registrationFormSchema>;

export function LoginForm({ redirectTo }: { redirectTo?: string | undefined }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  const submit = form.handleSubmit(async (values) => {
    setServerError(undefined);
    try {
      await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify(values) });
      router.replace(safeRedirect(redirectTo, "/dashboard"));
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to sign in.");
    }
  });
  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <FormError message={serverError} />
      <FormField
        autoComplete="email"
        error={form.formState.errors.email?.message}
        label="Email address"
        placeholder="you@example.com"
        registration={form.register("email")}
        type="email"
      />
      <div>
        <FormField
          autoComplete="current-password"
          error={form.formState.errors.password?.message}
          label="Password"
          registration={form.register("password")}
          type="password"
        />
        <Link className="mt-2 block text-right text-xs font-semibold text-sky-800 hover:underline" href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <SubmitButton loading={form.formState.isSubmitting}>Sign in securely</SubmitButton>
      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link className="font-semibold text-sky-800 hover:underline" href="/register">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<Registration>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: { termsAccepted: false, phone: "" }
  });
  const password = form.watch("password") ?? "";
  const submit = form.handleSubmit(async ({ confirmPassword: _, ...values }) => {
    setServerError(undefined);
    try {
      await apiRequest("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
      router.replace("/verify-account?welcome=1");
      router.refresh();
    } catch (error) {
      const typed = error as Error & { fields?: Record<string, string[]> };
      if (typed.fields) {
        for (const [field, messages] of Object.entries(typed.fields)) {
          if (field in form.getValues() && messages?.[0]) form.setError(field as keyof Registration, { message: messages[0] });
        }
      }
      setServerError(typed.message);
    }
  });
  return (
    <form className="space-y-4" noValidate onSubmit={submit}>
      <FormError message={serverError} />
      <FormField autoComplete="name" error={form.formState.errors.name?.message} label="Full name" registration={form.register("name")} />
      <FormField autoComplete="email" error={form.formState.errors.email?.message} label="Email address" placeholder="you@example.com" registration={form.register("email")} type="email" />
      <FormField autoComplete="tel" error={form.formState.errors.phone?.message} hint="Optional · Use international format." label="Phone number" placeholder="+923001234567" registration={form.register("phone")} type="tel" />
      <div>
        <FormField autoComplete="new-password" error={form.formState.errors.password?.message} label="Password" registration={form.register("password")} type="password" />
        <PasswordStrength password={password} />
      </div>
      <FormField autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} label="Confirm password" registration={form.register("confirmPassword")} type="password" />
      <div>
        <label className="flex items-start gap-3 text-sm leading-5 text-slate-600">
          <input className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-800" type="checkbox" {...form.register("termsAccepted")} />
          <span>
            I accept the <Link className="font-medium text-sky-800 hover:underline" href="/terms">terms</Link> and{" "}
            <Link className="font-medium text-sky-800 hover:underline" href="/acceptable-use">acceptable-use policy</Link>.
          </span>
        </label>
        {form.formState.errors.termsAccepted ? <p className="mt-1 text-xs text-red-700">{form.formState.errors.termsAccepted.message}</p> : null}
      </div>
      <SubmitButton loading={form.formState.isSubmitting}>Create account</SubmitButton>
      <p className="text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-sky-800 hover:underline" href="/login">Sign in</Link></p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({ resolver: zodResolver(forgotPasswordSchema) });
  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(undefined);
        try {
          const result = await apiRequest<{ message: string }>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify(values) });
          setMessage(result.message);
        } catch (error) {
          setServerError(error instanceof Error ? error.message : "Unable to submit request.");
        }
      })}
    >
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{message}</div> : null}
      <FormError message={serverError} />
      <FormField autoComplete="email" error={form.formState.errors.email?.message} label="Email address" registration={form.register("email")} type="email" />
      <SubmitButton loading={form.formState.isSubmitting}>Send reset link</SubmitButton>
      <Link className="block text-center text-sm font-semibold text-sky-800 hover:underline" href="/login">Back to sign in</Link>
    </form>
  );
}

const resetSchema = z.object({ password: passwordSchema, confirmPassword: z.string() }).refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export function ResetPasswordForm({ token }: { token?: string | undefined }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const form = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  const password = form.watch("password") ?? "";
  if (!token) return <FormError message="This password reset link is incomplete or invalid." />;
  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit(async (values) => {
      setServerError(undefined);
      try {
        await apiRequest("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password: values.password }) });
        router.replace("/login?reset=1");
      } catch (error) {
        setServerError(error instanceof Error ? error.message : "Unable to reset password.");
      }
    })}>
      <FormError message={serverError} />
      <div><FormField autoComplete="new-password" error={form.formState.errors.password?.message} label="New password" registration={form.register("password")} type="password" /><PasswordStrength password={password} /></div>
      <FormField autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} label="Confirm new password" registration={form.register("confirmPassword")} type="password" />
      <SubmitButton loading={form.formState.isSubmitting}>Reset password</SubmitButton>
    </form>
  );
}
