"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Optional adornment rendered inside the right edge of the input. */
  trailing?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, className, id, trailing, ...props }, ref) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const errorId = `${fieldId}-error`;

    return (
      <div className={cn("space-y-1.5", className)}>
        <Label htmlFor={fieldId}>{label}</Label>
        {trailing ? (
          <div className="relative">
            <Input
              ref={ref}
              id={fieldId}
              className="pr-10"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              {...props}
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              {trailing}
            </span>
          </div>
        ) : (
          <Input
            ref={ref}
            id={fieldId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
