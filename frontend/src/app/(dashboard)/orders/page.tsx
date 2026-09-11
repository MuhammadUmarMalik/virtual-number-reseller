"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCurrency } from "@/hooks/use-currency";
import { getOrders } from "@/services/order.service";

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders({ page, limit: 20 }),
  });

  const { formatPrice } = useCurrency();

  if (query.isLoading) {
    return <LoadingState label="Loading orders..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load your orders." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Orders"
        description="View your purchase history"
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          description="Buy a number from the dashboard to get started."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((order) => (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-primary hover:text-primary/80"
                        >
                          {order.orderCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0) ??
                          "—"}
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
          </div>

          <ul className="divide-y divide-border sm:hidden">
            {data.items.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-primary hover:text-primary/80"
                    >
                      {order.orderCode}
                    </Link>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0) ??
                      "—"}{" "}
                    items
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-foreground">
                    {formatPrice(order.total)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-PK")}
                  </p>
                </div>
              </li>
            ))}
          </ul>

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
