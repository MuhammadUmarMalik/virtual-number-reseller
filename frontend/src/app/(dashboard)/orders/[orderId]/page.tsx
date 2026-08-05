"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RefundModal } from "@/components/orders/refund-modal";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/format-currency";
import { getOrder } from "@/services/order.service";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [showRefund, setShowRefund] = useState(false);

  const query = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading order..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load this order." />;
  }

  const order = query.data;
  const canRefund = ["ACTIVE", "WAITING_OTP", "OTP_RECEIVED", "COMPLETED"].includes(
    order.status
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderCode}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleString("en-PK")}`}
        actions={
          canRefund && (
            <Button type="button" variant="danger" onClick={() => setShowRefund(true)}>
              Request Refund
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.product?.name ?? item.productId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Summary</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-medium text-slate-900">
                  {formatCurrency(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Total</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(order.total)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Numbers</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          {!order.items?.some((item) => item.otpCount > 0) ? (
            <p className="text-sm text-slate-500">
              No numbers available for this order yet.
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              View numbers and OTPs under Active Numbers.
            </p>
          )}
        </div>
      </section>

      {showRefund && (
        <RefundModal
          orderId={order.id}
          onClose={() => setShowRefund(false)}
          onSuccess={() => {
            setShowRefund(false);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}
