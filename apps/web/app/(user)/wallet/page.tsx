"use client";

import Link from "next/link";
import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { StatCard, DataCard, PageHeader, MoneyDisplay, LoadingState, ErrorState, EmptyState, StatusBadge, Button } from "@/components/design-system";
import { useWalletBalance, useTransactions } from "@/lib/hooks";

const typeTones: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  TOP_UP: "success",
  PURCHASE: "danger",
  REFUND: "info",
  ADMIN_CREDIT: "warning",
  ADMIN_DEBIT: "danger",
  REVERSAL: "neutral",
};

export default function WalletPage() {
  const { data: wallet, loading, error, refetch } = useWalletBalance();
  const { data: txData, loading: txLoading } = useTransactions({ take: 5 });

  const totalCredits = txData?.transactions
    .filter((t) => (t.direction === "CREDIT" || t.type === "REFUND") && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const totalPurchases = txData?.transactions
    .filter((t) => t.direction === "DEBIT" && t.type === "PURCHASE" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const totalRefunds = txData?.transactions
    .filter((t) => t.type === "REFUND" && t.status === "COMPLETED")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <AppShell title="Wallet">
      <PageHeader
        title="Wallet"
        description="Your account balance and transaction summary."
        actions={
          <Link href="/wallet/top-up">
            <Button>Add Balance</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Balance"
          value={
            loading ? null : error ? null : wallet ? (
              <MoneyDisplay amount={Number(wallet.balance)} currency={wallet.currency} />
            ) : (
              "—"
            )
          }
          loading={loading}
          error={error ?? undefined}
          tone="success"
        />
        <StatCard
          label="Total Credits"
          value={txLoading ? null : <MoneyDisplay amount={totalCredits} />}
          loading={txLoading}
        />
        <StatCard
          label="Total Purchases"
          value={txLoading ? null : <MoneyDisplay amount={totalPurchases} />}
          loading={txLoading}
          tone="danger"
        />
        <StatCard
          label="Total Refunds"
          value={txLoading ? null : <MoneyDisplay amount={totalRefunds} />}
          loading={txLoading}
          tone="info"
        />
      </div>

      <DataCard className="mt-6" loading={loading} error={error ?? undefined}>
        <h3 className="font-semibold text-slate-950">Recent Activity</h3>
        {txLoading ? (
          <LoadingState compact />
        ) : txData && txData.transactions.length > 0 ? (
          <>
            <div className="mt-4 space-y-2">
              {txData.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={typeTones[tx.type] ?? "neutral"}>{tx.type.replace("_", " ")}</StatusBadge>
                      <span className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    {tx.description ? (
                      <p className="mt-1 truncate text-slate-600">{tx.description}</p>
                    ) : null}
                  </div>
                  <span className={`shrink-0 font-semibold tabular-nums ${tx.direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
                    {tx.direction === "CREDIT" ? "+" : "-"}{MoneyDisplay({ amount: Number(tx.amount) })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <Link href="/transactions" className="text-sm font-medium text-[rgb(var(--accent))] hover:underline">
                View all transactions
              </Link>
            </div>
          </>
        ) : (
          <EmptyState title="No activity yet" description="Your transactions will appear here." compact />
        )}
      </DataCard>
    </AppShell>
  );
}
