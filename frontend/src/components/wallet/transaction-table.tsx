import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Description</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const isCredit = ["DEPOSIT", "REFUND", "ADJUSTMENT_CREDIT"].includes(
              transaction.type
            );
            const amount = Number(transaction.amount);

            return (
              <tr key={transaction.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {TYPE_LABELS[transaction.type] ?? transaction.type}
                </td>
                <td
                  className={`px-4 py-3 font-semibold ${
                    isCredit ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isCredit ? "+" : "-"}
                  {formatCurrency(amount)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {transaction.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(transaction.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
