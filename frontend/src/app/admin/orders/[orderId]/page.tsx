"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCurrency } from "@/hooks/use-currency";
import { getAdminOrder } from "@/services/admin.service";

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { formatPrice } = useCurrency();

  const query = useQuery({
    queryKey: ["admin", "orders", orderId],
    queryFn: () => getAdminOrder(orderId),
    enabled: Boolean(orderId),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading order..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load this order." />;
  }

  const order = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderCode}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleString("en-PK")}`}
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
                  <tr
                    key={item.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
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

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4" /> Customer
            </h2>
            {order.user ? (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{order.user.fullName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="text-right text-foreground">{order.user.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="font-mono text-foreground">
                    {order.user.whatsappNumber || "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{order.userId}</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-semibold text-foreground">{formatPrice(order.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={order.status} />
                </dd>
              </div>
              {order.failureReason && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd className="text-right text-foreground">{order.failureReason}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
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
                        ? new Date(number.expiresAt).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}