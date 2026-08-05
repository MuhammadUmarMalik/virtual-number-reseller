"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format-currency";
import { getOrders } from "@/services/order.service";

export default function OrdersPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders({ page, limit: 20 }),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading orders..." />;
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
          title="No orders yet"
          description="Buy a number from the dashboard to get started."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
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
                      className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          {order.orderCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.items?.reduce((sum, item) => sum + item.quantity, 0) ??
                          "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("en-PK")}
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
    </div>
  );
}
