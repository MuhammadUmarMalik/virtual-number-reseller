"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { RejectModal } from "@/components/admin/reject-modal";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format-currency";
import {
  approveRefund,
  getAdminRefunds,
  rejectRefund,
} from "@/services/admin.service";

export default function AdminRefundsPage() {
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["admin", "refunds", page],
    queryFn: () => getAdminRefunds({ page, limit: 20 }),
  });

  const handleApprove = async (refundId: string) => {
    try {
      await approveRefund(refundId);
      toast.success("Refund approved and wallet credited");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to approve refund"
      );
    }
  };

  const handleReject = async (refundId: string, reason: string) => {
    try {
      await rejectRefund(refundId, reason);
      toast.success("Refund rejected");
      void query.refetch();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to reject refund"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading refunds..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load refunds." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Refunds" description="Review refund requests" />

      {data.items.length === 0 ? (
        <EmptyState title="No refund requests" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((refund) => (
                    <tr
                      key={refund.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {refund.order?.orderCode ?? refund.orderId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(refund.amount)}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-500">
                        {refund.reason}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={refund.status} />
                      </td>
                      <td className="px-4 py-3">
                        {refund.status === "PENDING" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleApprove(refund.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setRejectingId(refund.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {refund.adminNotes ?? "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
