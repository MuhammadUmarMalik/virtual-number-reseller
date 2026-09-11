"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCurrency } from "@/hooks/use-currency";
import { getAdminOrders } from "@/services/admin.service";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "orders", page],
    queryFn: () => getAdminOrders({ page, limit: 20 }),
  });

  const { formatPrice } = useCurrency();

  if (query.isLoading) {
    return <LoadingState label="Loading orders..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load orders." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" description="All user orders" />

      {data.items.length === 0 ? (
        <EmptyState title="No orders yet" icon={<BookOpen className="h-6 w-6" />} />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {order.orderCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {order.user?.fullName ?? order.userId}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-PK")}
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
    </div>
  );
}
