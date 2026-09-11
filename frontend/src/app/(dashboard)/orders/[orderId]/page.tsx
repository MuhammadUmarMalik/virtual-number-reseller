"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { RefundModal } from "@/components/orders/refund-modal";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCurrency } from "@/hooks/use-currency";
import { getOrder } from "@/services/order.service";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [showRefund, setShowRefund] = useState(false);

  const query = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: Boolean(orderId),
  });

  const { formatPrice } = useCurrency();

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
          <h2 className="mb-4 text-lg font-semibold text-foreground">Items</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {item.product?.name ?? item.productId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPrice(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatPrice(item.totalPrice)}
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">Summary</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">
                  {formatPrice(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-semibold text-foreground">
                  {formatPrice(order.total)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Numbers</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          {!order.numbers || order.numbers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No numbers available for this order yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {order.numbers.map((number) => (
                <li
                  key={number.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground">
                      {number.phoneNumber}
                    </span>
                    <StatusBadge status={number.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>OTPs: {number.otpCount}</span>
                    <span>
                      Expires:{" "}
                      {number.expiresAt
                        ? new Date(number.expiresAt).toLocaleDateString("en-PK")
                        : "—"}
                    </span>
                    <Link
                      href="/active-numbers"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
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
