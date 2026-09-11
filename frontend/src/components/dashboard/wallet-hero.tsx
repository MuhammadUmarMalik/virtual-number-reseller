"use client";

import { ArrowUpRight, Wallet } from "lucide-react";
import Link from "next/link";

import { useCurrency } from "@/hooks/use-currency";

interface WalletHeroProps {
  balance: string;
  userName: string;
}

export function WalletHero({ balance, userName }: WalletHeroProps) {
  const firstName = userName.split(" ")[0] || "there";
  const { formatPrice } = useCurrency();

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium text-primary-foreground/80">
              Welcome back, {firstName}
            </span>
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-wide text-primary-foreground/70">
            Wallet Balance
          </p>
          <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatPrice(balance)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/active-numbers"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Active Numbers
          </Link>
          <Link
            href="/wallet"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-primary-foreground/90"
          >
            Top Up
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
