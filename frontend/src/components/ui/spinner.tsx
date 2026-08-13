import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md" }: SpinnerProps) {
  const sizeClass =
    size === "lg"
      ? "h-8 w-8 border-4"
      : size === "sm"
        ? "h-3 w-3 border"
        : "h-4 w-4 border-2";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClass,
        className
      )}
    />
  );
}
