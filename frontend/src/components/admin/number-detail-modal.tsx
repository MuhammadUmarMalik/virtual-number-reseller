"use client";

import { useQuery } from "@tanstack/react-query";
import { Phone } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  getAdminNumber,
  type AdminPurchasedNumber,
} from "@/services/admin.service";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PK");
}

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

interface NumberDetailModalProps {
  number: AdminPurchasedNumber;
  onClose: () => void;
}

export function NumberDetailModal({ number, onClose }: NumberDetailModalProps) {
  const detail = useQuery({
    queryKey: ["admin", "number-detail", number.id],
    queryFn: () => getAdminNumber(number.id),
    initialData: number,
  });

  return (
    <Modal title="Number Details" onClose={onClose} maxWidth="2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">{number.phoneNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {detail.data?.status && <StatusBadge status={detail.data.status} />}
          {detail.data?.activationStatus && (
            <StatusBadge status={detail.data.activationStatus} />
          )}
        </div>
      </div>

      {detail.isLoading ? (
        <LoadingState label="Loading details..." />
      ) : detail.isError || !detail.data ? (
        <ErrorState message="Unable to load number details." />
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          <DetailRow label="User" value={detail.data.user?.fullName ?? null} />
          <DetailRow label="Email" value={detail.data.user?.email ?? null} />
          <DetailRow label="Product" value={detail.data.product?.name ?? null} />
          <DetailRow label="Vendor" value={detail.data.vendor ?? null} />
          <DetailRow
            label="Activation ID"
            value={detail.data.vendorActivationId ?? null}
          />
          <DetailRow label="Vendor Order ID" value={detail.data.vendorOrderId ?? null} />
          <DetailRow label="Country" value={detail.data.country ?? null} />
          <DetailRow label="Service" value={detail.data.service ?? null} />
          <DetailRow label="Provider" value={detail.data.provider ?? null} />
          <DetailRow label="Operator" value={detail.data.vendorOperator ?? null} />
          <DetailRow
            label="Selling Price"
            value={
              detail.data.sellingPrice
                ? `${detail.data.sellingPrice} ${detail.data.currency ?? ""}`
                : null
            }
          />
          <DetailRow
            label="Vendor Cost"
            value={detail.data.vendorCost ?? null}
          />
          <DetailRow label="OTP Count" value={String(detail.data.otpCount)} />
          <DetailRow
            label="Purchased At"
            value={formatDate(detail.data.purchasedAt)}
          />
          <DetailRow
            label="Activation Started"
            value={formatDate(detail.data.activationStartedAt)}
          />
          <DetailRow
            label="Activation Completed"
            value={formatDate(detail.data.activationCompletedAt)}
          />
          <DetailRow
            label="Cancelled At"
            value={formatDate(detail.data.cancelledAt)}
          />
          <DetailRow label="Expires At" value={formatDate(detail.data.expiresAt)} />
          <DetailRow
            label="Last Checked"
            value={formatDate(detail.data.lastCheckedAt)}
          />
        </div>
      )}

      <div className="mt-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          OTP Messages
        </h3>
        {(() => {
          const messages = detail.data?.otpMessages ?? [];
          if (messages.length === 0) {
            return <p className="text-sm text-muted-foreground">No OTP messages yet.</p>;
          }
          return (
            <div className="space-y-2">
              {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-base font-semibold text-foreground">
                    {message.otpCode ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.receivedAt)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {message.rawMessage}
                </p>
              </div>
            ))}
            </div>
          );
        })()}
      </div>
    </Modal>
  );
}