"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { RejectModal } from "@/components/admin/reject-modal";
import { ApiError } from "@/lib/api-client";
import { useCurrency } from "@/hooks/use-currency";
import {
  approveTopup,
  getAdminTopups,
  rejectTopup,
} from "@/services/admin.service";

export default function AdminTopupsPage() {
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "topups", page],
    queryFn: () => getAdminTopups({ page, limit: 20 }),
  });

  const { formatPrice } = useCurrency();

  const handleApprove = async (topupId: string) => {
    try {
      await approveTopup(topupId);
      toast.success("Top-up approved and wallet credited");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to approve top-up"
      );
    }
  };

  const handleReject = async (topupId: string, reason: string) => {
    try {
      await rejectTopup(topupId, reason);
      toast.success("Top-up rejected");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to reject top-up"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading top-ups..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load top-ups." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Top-Up Requests"
        description="Review and approve user payments"
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No top-up requests"
          icon={<Wallet className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Sender</th>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((topup) => (
                  <tr
                    key={topup.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {topup.requestCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatPrice(topup.amount)}
                      {topup.displayAmount &&
                        topup.currency &&
                        topup.currency !== "USD" && (
                          <p className="text-xs font-normal text-muted-foreground">
                            Original: {topup.currency}{" "}
                            {Number(topup.displayAmount).toFixed(2)}
                          </p>
                        )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {topup.senderAccount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {topup.transactionId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={topup.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(topup.createdAt).toLocaleDateString("en-PK")}
                    </td>
                    <td className="px-4 py-3">
                      {topup.status === "PENDING" ||
                      topup.status === "UNDER_REVIEW" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void handleApprove(topup.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectingId(topup.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {topup.rejectionReason ? "Rejected" : "—"}
                        </span>
                      )}
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

      {rejectingId && (
        <RejectModal
          onClose={() => setRejectingId(null)}
          onReject={(reason) => handleReject(rejectingId, reason)}
        />
      )}
    </div>
  );
}
