"use client";

import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrency } from "@/hooks/use-currency";
import { getAdminOrder } from "@/services/admin.service";
import type { Order } from "@/types/order.types";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">
        {value ?? "—"}
      </span>
    </div>
  );
}

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const { formatPrice } = useCurrency();

  const detail = useQuery({
    queryKey: ["admin", "order-detail", order.id],
    queryFn: () => getAdminOrder(order.id),
    initialData: order,
  });

  const data = detail.data;

  return (
    <Modal title="Order Details" onClose={onClose} maxWidth="2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">{data?.orderCode}</span>
        </div>
        {data?.status && <StatusBadge status={data.status} />}
      </div>

      {detail.isLoading ? (
        <LoadingState label="Loading order..." />
      ) : detail.isError || !data ? (
        <ErrorState message="Unable to load order details." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
            <DetailRow label="Order ID" value={data.id} />
            <DetailRow label="Created" value={new Date(data.createdAt).toLocaleString("en-PK")} />
            <DetailRow label="Customer" value={data.user?.fullName ?? data.userId} />
            <DetailRow label="Email" value={data.user?.email ?? null} />
            <DetailRow label="WhatsApp" value={data.user?.whatsappNumber ?? null} />
            <DetailRow label="Status" value={data.status} />
            <DetailRow label="Subtotal" value={formatPrice(data.subtotal)} />
            <DetailRow label="Total" value={formatPrice(data.total)} />
            {data.failureReason && (
              <DetailRow label="Failure reason" value={data.failureReason} />
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Items
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2">Product</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Unit</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-2 font-medium text-foreground">
                        {item.product?.name ?? item.productId}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {formatPrice(item.unitPrice)}
                      </td>
                      <td className="px-4 py-2 font-semibold text-foreground">
                        {formatPrice(item.totalPrice)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.numbers && data.numbers.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Numbers
              </h3>
              <ul className="space-y-2">
                {data.numbers.map((number) => (
                  <li
                    key={number.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-foreground">
                        {number.phoneNumber}
                      </span>
                      <StatusBadge status={number.status} />
                    </div>
                    <span className="text-muted-foreground">
                      OTPs: {number.otpCount} · Expires:{" "}
                      {number.expiresAt
                        ? new Date(number.expiresAt).toLocaleString("en-PK", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}