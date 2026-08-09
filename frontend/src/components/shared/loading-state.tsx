import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  label?: string;
  className?: string;
  variant?: "card" | "table" | "grid";
  rows?: number;
}

export function LoadingState({
  label = "Loading...",
  className,
  variant = "card",
  rows = 3,
}: LoadingStateProps) {
  return (
    <div role="status" aria-label={label} className={cn("space-y-4", className)}>
      {variant === "table" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between gap-4 p-4",
                index !== 0 && "border-t border-border"
              )}
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      )}
      {variant === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-border bg-card p-5"
            >
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}
      {variant === "card" && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
