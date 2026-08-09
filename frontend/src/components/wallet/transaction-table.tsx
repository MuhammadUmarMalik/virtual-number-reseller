import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format-currency";
import type { WalletTransaction } from "@/types/wallet.types";

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: "Deposit",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT_CREDIT: "Credit",
  ADJUSTMENT_DEBIT: "Debit",
  REVERSAL: "Reversal",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface TransactionTableProps {
  transactions: WalletTransaction[];
}

function isCredit(type: string): boolean {
  return ["DEPOSIT", "REFUND", "ADJUSTMENT_CREDIT"].includes(type);
}

function AmountLabel({ transaction }: { transaction: WalletTransaction }) {
  const credit = isCredit(transaction.type);
  const amount = Number(transaction.amount);
  return (
    <span
      className={`font-semibold ${
        credit
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {credit ? "+" : "-"}
      {formatCurrency(amount)}
    </span>
  );
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Your wallet transactions will appear here."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {TYPE_LABELS[transaction.type] ?? transaction.type}
                </td>
                <td className="px-4 py-3">
                  <AmountLabel transaction={transaction} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {transaction.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(transaction.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border sm:hidden">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {TYPE_LABELS[transaction.type] ?? transaction.type}
                </p>
                <StatusBadge status={transaction.status} />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {transaction.description ?? formatDate(transaction.createdAt)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <AmountLabel transaction={transaction} />
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
