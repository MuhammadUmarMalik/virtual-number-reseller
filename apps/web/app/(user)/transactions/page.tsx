"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import {
  PageHeader,
  FilterBar,
  FormField,
  DataCard,
  StatusBadge,
  MoneyDisplay,
  EmptyState,
  LoadingState,
  ErrorState,
  Pagination,
  SearchInput,
  Button,
} from "@/components/design-system";
import { useTransactions } from "@/lib/hooks";

const TX_TYPES = [
  { value: "", label: "All types" },
  { value: "TOP_UP", label: "Top-ups" },
  { value: "PURCHASE", label: "Purchases" },
  { value: "REFUND", label: "Refunds" },
  { value: "ADMIN_CREDIT", label: "Admin credits" },
  { value: "ADMIN_DEBIT", label: "Admin debits" },
  { value: "REVERSAL", label: "Reversals" },
];

const typeTones: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  TOP_UP: "success",
  PURCHASE: "danger",
  REFUND: "info",
  ADMIN_CREDIT: "warning",
  ADMIN_DEBIT: "danger",
  REVERSAL: "neutral",
};

const statusTones: Record<string, "neutral" | "success" | "warning" | "danger" | "info"> = {
  COMPLETED: "success",
  PENDING: "warning",
  FAILED: "danger",
  REVERSED: "neutral",
};

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  const [type, setType] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [cursor, setCursor] = React.useState<string | undefined>(undefined);
  const [cursorStack, setCursorStack] = React.useState<string[]>([]);

  const filters = React.useMemo(() => ({
    type: type || undefined,
    search: search || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
    cursor,
    take: PAGE_SIZE,
  }), [type, search, from, to, cursor]);

  const { data, loading, error, refetch } = useTransactions(filters);

  const handleSearch = () => {
    setCursor(undefined);
    setCursorStack([]);
    void refetch(filters);
  };

  const handleNext = () => {
    if (data?.nextCursor) {
      setCursorStack((prev) => [...prev, cursor ?? "null"]);
      setCursor(data.nextCursor);
    }
  };

  const handlePrev = () => {
    const prev = cursorStack[cursorStack.length - 1];
    setCursorStack((prev) => prev.slice(0, -1));
    setCursor(prev === "null" ? undefined : prev);
  };

  const handleFirst = () => {
    setCursor(undefined);
    setCursorStack([]);
  };

  const hasPrev = cursorStack.length > 0;
  const hasNext = Boolean(data?.nextCursor);

  return (
    <AppShell title="Transactions">
      <PageHeader
        title="Transactions"
        description="Your complete wallet transaction history."
      />

      <FilterBar>
        <div className="min-w-0 flex-1">
          <SearchInput
            placeholder="Search by reference, description..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); }}
          />
        </div>
        <FormField id="tx-type" label="Type">
          <select
            id="tx-type"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={type}
            onChange={(e) => { setType(e.target.value); setCursor(undefined); setCursorStack([]); }}
          >
            {TX_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FormField>
        <FormField id="tx-from" label="From">
          <input
            id="tx-from"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </FormField>
        <FormField id="tx-to" label="To">
          <input
            id="tx-to"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </FormField>
        <div className="flex items-end pb-1.5">
          <Button variant="primary" onClick={handleSearch}>Search</Button>
        </div>
      </FilterBar>

      {loading ? (
        <DataCard className="mt-4"><LoadingState label="Loading transactions" /></DataCard>
      ) : error ? (
        <DataCard className="mt-4" error={error}><span /></DataCard>
      ) : data && data.transactions.length === 0 ? (
        <DataCard className="mt-4" empty><span /></DataCard>
      ) : data ? (
        <>
          <div className="mt-4 text-sm text-slate-500">
            {data.totalCount} transaction{data.totalCount !== 1 ? "s" : ""}
          </div>

          <div className="mt-2 space-y-3 sm:hidden">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={typeTones[tx.type] ?? "neutral"}>
                        {tx.type.replace("_", " ")}
                      </StatusBadge>
                      <StatusBadge tone={statusTones[tx.status] ?? "neutral"}>
                        {tx.status}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                    {tx.description ? (
                      <p className="mt-1 text-sm text-slate-600">{tx.description}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-400">
                      Ref: {tx.referenceType} / {tx.referenceId.slice(0, 8)}...
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-base font-semibold tabular-nums ${tx.direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.direction === "CREDIT" ? "+" : "-"}{MoneyDisplay({ amount: Number(tx.amount) })}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Balance: {MoneyDisplay({ amount: Number(tx.balanceAfter) })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto sm:block">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Transaction history</caption>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3" scope="col">Date</th>
                    <th className="whitespace-nowrap px-4 py-3" scope="col">Type</th>
                    <th className="whitespace-nowrap px-4 py-3" scope="col">Status</th>
                    <th className="whitespace-nowrap px-4 py-3" scope="col">Description</th>
                    <th className="whitespace-nowrap px-4 py-3" scope="col">Reference</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right" scope="col">Amount</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right" scope="col">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        <span className="tabular-nums">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        <br />
                        <span className="text-xs">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge tone={typeTones[tx.type] ?? "neutral"}>
                          {tx.type.replace("_", " ")}
                        </StatusBadge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge tone={statusTones[tx.status] ?? "neutral"}>
                          {tx.status}
                        </StatusBadge>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-slate-700">
                        <span className="break-words">{tx.description ?? "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {tx.referenceType}
                        <br />
                        <span className="font-mono">{tx.referenceId.slice(0, 12)}...</span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${tx.direction === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.direction === "CREDIT" ? "+" : "-"}{MoneyDisplay({ amount: Number(tx.amount) })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                        {MoneyDisplay({ amount: Number(tx.balanceAfter) })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <Pagination
              page={cursorStack.length + 1}
              totalPages={Math.ceil((data.totalCount || 1) / PAGE_SIZE)}
              onFirst={handleFirst}
              onPrev={hasPrev ? handlePrev : undefined}
              onNext={hasNext ? handleNext : undefined}
            />
          </div>
        </>
      ) : null}
    </AppShell>
  );
}
