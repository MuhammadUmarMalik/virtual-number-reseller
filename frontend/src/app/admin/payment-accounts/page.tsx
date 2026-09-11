"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentAccountFormModal } from "@/components/admin/payment-account-form-modal";
import { ApiError } from "@/lib/api-client";
import {
  deletePaymentAccount,
  getPaymentAccounts,
  updatePaymentAccount,
} from "@/services/admin.service";
import type { PaymentAccount, PaymentMethod } from "@/types/wallet.types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank Transfer",
};

export default function AdminPaymentAccountsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "payment-accounts", page],
    queryFn: () => getPaymentAccounts({ page, limit: 20 }),
  });

  const toggleMutation = useMutation({
    mutationFn: (account: PaymentAccount) =>
      updatePaymentAccount(account.id, { isActive: !account.isActive }),
    onSuccess: (_data, account) => {
      toast.success(account.isActive ? "Payment account disabled" : "Payment account enabled");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payment-accounts"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to update payment account"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) => deletePaymentAccount(accountId),
    onSuccess: () => {
      toast.success("Payment account deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payment-accounts"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to delete payment account"
      );
    },
  });

  const handleDelete = (account: PaymentAccount) => {
    if (window.confirm(`Delete "${account.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(account.id);
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading payment accounts..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load payment accounts." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Accounts"
        description="Accounts customers send top-up payments to"
        actions={
          <Button type="button" onClick={() => setShowCreate(true)}>
            Add Payment Account
          </Button>
        }
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No payment accounts yet"
          description="Add an Easypaisa, JazzCash, or bank account so users can top up."
          icon={<CreditCard className="h-6 w-6" />}
          action={
            <Button onClick={() => setShowCreate(true)}>
              Add Payment Account
            </Button>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Account Name</th>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {account.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {METHOD_LABELS[account.paymentMethod]}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {account.accountName}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {account.accountNumber}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={account.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMutation.mutate(account)}
                          isLoading={
                            toggleMutation.isPending &&
                            toggleMutation.variables?.id === account.id
                          }
                          title={
                            account.isActive
                              ? "Disable account"
                              : "Enable account"
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            {account.isActive ? "Disable" : "Enable"}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAccount(account)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(account)}
                          isLoading={
                            deleteMutation.isPending &&
                            deleteMutation.variables === account.id
                          }
                          title="Delete account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {(showCreate || editingAccount) && (
        <PaymentAccountFormModal
          account={editingAccount}
          onClose={() => {
            setShowCreate(false);
            setEditingAccount(null);
          }}
          onSuccess={() => {
            setShowCreate(false);
            setEditingAccount(null);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}