"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function FormField({
  label,
  error,
  registration,
  hint,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = input.type === "password";
  const id = registration.name;
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-800" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          {...input}
          {...registration}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-invalid={Boolean(error)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-sky-700 focus:ring-2 focus:ring-sky-700/15 disabled:bg-slate-100"
          id={id}
          type={isPassword ? (visible ? "text" : "password") : input.type}
        />
        {isPassword ? (
          <button
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
            onClick={() => setVisible((value) => !value)}
            type="button"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-700" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      className="flex h-11 w-full items-center justify-center rounded-lg bg-sky-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-65"
      disabled={loading}
      type="submit"
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string | undefined }) {
  return message ? (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
      {message}
    </div>
  ) : null;
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 10,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ];
  const strength = checks.filter(Boolean).length;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
  return (
    <div aria-live="polite" className="mt-2">
      <div className="grid grid-cols-4 gap-1">
        {checks.map((_, index) => (
          <span className={`h-1 rounded-full ${index < strength ? "bg-sky-700" : "bg-slate-200"}`} key={index} />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {labels[strength]} · Use 10+ characters with upper/lowercase, a number, and a symbol.
      </p>
    </div>
  );
}
