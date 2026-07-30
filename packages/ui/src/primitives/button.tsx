import * as React from "react";
import { cn } from "../utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-[rgb(var(--accent))] text-white hover:bg-[rgb(var(--accent-strong))] focus-visible:ring-[rgb(var(--focus))]",
    secondary: "border border-slate-200 bg-white text-slate-950 shadow-sm hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-700"
  };

  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    icon: "h-10 w-10 p-0"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
