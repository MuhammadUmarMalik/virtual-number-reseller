"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleSlash,
  Clock,
  Globe,
  MessageSquareText,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { RefundModal } from "@/components/orders/refund-modal";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import {
  useActivationPolling,
  useCompleteActivation,
  useRequestAnotherSms,
} from "@/hooks/use-activation";
import type {
  PurchasedNumber,
  PurchasedNumberStatus,
} from "@/types/number.types";

const TERMINAL_STATUSES: PurchasedNumberStatus[] = [
  "EXPIRED",
  "REFUNDED",
  "DISABLED",
];

const STATUS_LABELS: Record<PurchasedNumberStatus, string> = {
  WAITING: "WAITING FOR SMS",
  ACTIVE: "WAITING FOR SMS",
  RECEIVED: "SMS RECEIVED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
  DISABLED: "ACTIVATION CLOSED",
};

const STATUS_TEXT: Record<PurchasedNumberStatus, string> = {
  WAITING: "Waiting for code...",
  ACTIVE: "Waiting for code...",
  RECEIVED: "SMS was received",
  EXPIRED: "No SMS received in time",
  REFUNDED: "Refunded",
  DISABLED: "Activation closed",
};

interface StatusBannerProps {
  status: PurchasedNumberStatus;
  price: string | undefined;
}

function StatusBanner({ status, price }: StatusBannerProps) {
  const isError = status === "EXPIRED" || status === "REFUNDED";
  const isSuccess = status === "RECEIVED";
  const isNeutral = status === "DISABLED";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-t-xl border-b px-5 py-3",
        isError
          ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10"
          : isSuccess
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
            : isNeutral
              ? "border-border bg-muted/50"
              : "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
          isError
            ? "border-red-200 bg-white text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-400"
            : isSuccess
              ? "border-emerald-200 bg-white text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400"
              : isNeutral
                ? "border-border bg-background text-muted-foreground"
                : "border-amber-200 bg-white text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400"
        )}
      >
        {isError ? (
          <CircleSlash className="h-3.5 w-3.5" />
        ) : isSuccess ? (
          <BadgeCheck className="h-3.5 w-3.5" />
        ) : (
          <Clock className="h-3.5 w-3.5" />
        )}
        {STATUS_LABELS[status]}
      </span>
      {price !== undefined && (
        <span className="text-xs font-medium text-muted-foreground">
          LOCKED {formatCurrency(price)}
        </span>
      )}
    </div>
  );
}

interface ServiceInfoProps {
  number: PurchasedNumber;
}

function ServiceInfo({ number }: ServiceInfoProps) {
  const service = number.product?.service ?? "Unknown service";
  const country = number.product?.country ?? "";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
          {service.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {number.product?.name ?? service}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            {service}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {country && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            <Globe className="h-3 w-3" />
            {country}
          </span>
        )}
        <span className="font-mono text-sm font-semibold text-foreground">
          {number.phoneNumber}
        </span>
        <CopyButton value={number.phoneNumber} label="" />
      </div>
    </div>
  );
}

interface StatusPriceProps {
  status: PurchasedNumberStatus;
  otpCount: number;
  price: string | undefined;
}

function StatusPrice({ status, otpCount, price }: StatusPriceProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {STATUS_TEXT[status]}
          {otpCount > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({otpCount} SMS{otpCount > 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Price
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {price !== undefined ? formatCurrency(price) : "—"}
        </p>
      </div>
    </div>
  );
}

interface ActionsProps {
  status: PurchasedNumberStatus;
  canGetAnotherSms: boolean;
  disabled: boolean;
  confirmingFinish: boolean;
  onAnotherSms: () => void;
  onFinish: () => void;
}

function Actions({
  status,
  canGetAnotherSms,
  disabled,
  confirmingFinish,
  onAnotherSms,
  onFinish,
}: ActionsProps) {
  const terminal = TERMINAL_STATUSES.includes(status);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        disabled={disabled || terminal || !canGetAnotherSms}
        onClick={onAnotherSms}
        className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-600/40"
      >
        <RefreshCw className="h-4 w-4" />
        Another SMS
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || terminal}
        onClick={onFinish}
        className={cn(
          confirmingFinish
            ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
            : "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
        )}
      >
        <BadgeCheck className="h-4 w-4" />
        {confirmingFinish ? "Confirm finish?" : "Finish Activation"}
      </Button>
    </div>
  );
}

function OtpDisplay({ code }: { code: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
      <MessageSquareText className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Your verification code
        </p>
        <p className="font-mono text-3xl font-bold tracking-widest text-foreground">
          {code}
        </p>
      </div>
      <CopyButton value={code} label="" />
    </div>
  );
}

interface HelperTextProps {
  status: PurchasedNumberStatus;
  onRequestRefund: () => void;
}

function HelperText({ status, onRequestRefund }: HelperTextProps) {
  const waiting = status === "WAITING" || status === "ACTIVE";
  const expired = status === "EXPIRED" || status === "REFUNDED";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <p>Average wait time: up to 5 minutes.</p>
      {expired ? (
        <p className="font-medium text-red-600 dark:text-red-400">
          Money will be refunded automatically for this activation.
        </p>
      ) : waiting ? (
        <button
          type="button"
          onClick={onRequestRefund}
          className="font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
        >
          Cancel & request refund
        </button>
      ) : null}
    </div>
  );
}

interface BuyAnotherLinkProps {
  productId: string;
}

function BuyAnotherLink({ productId }: BuyAnotherLinkProps) {
  return (
    <Link
      href={`/dashboard?buy=${productId}`}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
    >
      Buy another one number
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

interface ActivationCardProps {
  number: PurchasedNumber;
  onClosed?: (numberId: string) => void;
}

export function ActivationCard({ number, onClosed }: ActivationCardProps) {
  const [closed, setClosed] = useState<PurchasedNumberStatus | null>(null);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const requestAnotherSms = useRequestAnotherSms();
  const completeActivation = useCompleteActivation();

  const poll = useActivationPolling(number.id, closed ?? number.status);

  const effectiveStatus: PurchasedNumberStatus =
    closed !== null
      ? closed
      : TERMINAL_STATUSES.includes(number.status)
        ? number.status
        : (poll.data?.status ?? number.status);

  const otpCode =
    effectiveStatus === "RECEIVED"
      ? (poll.data?.newMessages?.[0]?.otpCode ?? null)
      : null;

  const otpCount = poll.data?.otpCount ?? number.otpCount;

  const price = useMemo(
    () => number.product?.sellingPrice,
    [number.product?.sellingPrice]
  );

  const handleAnotherSms = async () => {
    try {
      await requestAnotherSms.mutateAsync(number.id);
      setConfirmingFinish(false);
      toast.success("Another SMS requested. Waiting for a new code...");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to request another SMS"
      );
    }
  };

  const handleFinish = async () => {
    if (!confirmingFinish) {
      setConfirmingFinish(true);
      window.setTimeout(() => setConfirmingFinish(false), 4000);
      return;
    }
    try {
      await completeActivation.mutateAsync(number.id);
      setClosed("DISABLED");
      toast.success("Activation closed. No further SMS will be polled.");
      onClosed?.(number.id);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to close activation"
      );
    } finally {
      setConfirmingFinish(false);
    }
  };

  const busy =
    requestAnotherSms.isPending || completeActivation.isPending;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <StatusBanner status={effectiveStatus} price={price} />

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-start sm:gap-6">
        <ServiceInfo number={number} />
        <StatusPrice status={effectiveStatus} otpCount={otpCount} price={price} />
        <Actions
          status={effectiveStatus}
          canGetAnotherSms={Boolean(number.canGetAnotherSms)}
          disabled={busy}
          confirmingFinish={confirmingFinish}
          onAnotherSms={handleAnotherSms}
          onFinish={handleFinish}
        />
      </div>

      {otpCode && <div className="px-5 pb-4"><OtpDisplay code={otpCode} /></div>}

      <div className="space-y-3 border-t border-border px-5 py-4">
        <HelperText
          status={effectiveStatus}
          onRequestRefund={() => setShowRefund(true)}
        />
        <BuyAnotherLink productId={number.productId} />
      </div>

      {showRefund && (
        <RefundModal
          orderId={number.orderId}
          onClose={() => setShowRefund(false)}
          onSuccess={() => {
            setShowRefund(false);
            setClosed("REFUNDED");
          }}
        />
      )}
    </div>
  );
}
