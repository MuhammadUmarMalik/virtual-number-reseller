import type { ReactNode } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function AuthShell({ title, subtitle, children, className }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />
      <div className={cn("relative w-full max-w-md", className)}>
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Number Reseller
          </Link>
          <ThemeToggle />
        </div>
        <Card>
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </Card>
      </div>
    </main>
  );
}
