import type { BadgeVariant } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  COMPLETED: "success",
  APPROVED: "success",
  OTP_RECEIVED: "success",
  RECEIVED: "success",
  PROCESSING: "info",
  WAITING_OTP: "info",
  PENDING: "warning",
  UNDER_REVIEW: "warning",
  OUT_OF_STOCK: "warning",
  INACTIVE: "neutral",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
  SUSPENDED: "warning",
  REFUND_PENDING: "warning",
  FAILED: "danger",
  REJECTED: "danger",
  BLOCKED: "danger",
  DISABLED: "danger",
  REFUNDED: "info",
  WAITING: "info",
};

export function statusVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[status] ?? "neutral";
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>;
}
