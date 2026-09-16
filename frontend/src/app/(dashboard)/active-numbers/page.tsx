"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, RefreshCw, RotateCw, Undo2, XCircle } from "lucide-react";

import { ActivationCard } from "@/components/numbers/activation-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useGetOtp } from "@/hooks/use-active-numbers";
import { ApiError } from "@/lib/api-client";
import {
  getActiveNumbers,
  getNumberStatus,
  cancelNumber,
  retryNumber,
  requestRefund,
} from "@/services/number.service";
import type { OtpResult, RefundStatus } from "@/types/number.types";

export default function ActiveNumbersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [otpByNumber, setOtpByNumber] = useState<Record<string, OtpResult>>({});
  const [pendingRefunds, setPendingRefunds] = useState<Record<string, true>>({});
  const getOtp = useGetOtp();

  const query = useQuery({
    queryKey: ["numbers", page],
    queryFn: () => getActiveNumbers({ page, limit: 20 }),
    refetchInterval: 15_000,
  });

  const invalidateAndToast = (error: unknown, fallback: string) => {
    toast.error(error instanceof ApiError ? error.message : fallback);
  };

  const refreshMutation = useMutation({
    mutationFn: getNumberStatus,
    onSuccess: (result) => {
      toast.success(
        `Status: ${result.activationStatus?.replace("STATUS_", "") ?? "—"}`
      );
      void queryClient.invalidateQueries({ queryKey: ["numbers"] });
    },
    onError: (error) => invalidateAndToast(error, "Unable to refresh status"),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelNumber,
    onSuccess: (result) => {
      toast.success(
        result.refunded
          ? `Activation cancelled — Rs. ${result.refunded} refunded`
          : "Activation cancelled"
      );
      void queryClient.invalidateQueries({ queryKey: ["numbers"] });
    },
    onError: (error) => invalidateAndToast(error, "Unable to cancel activation"),
  });

  const retryMutation = useMutation({
    mutationFn: retryNumber,
    onSuccess: () => {
      toast.success("New code requested");
      void queryClient.invalidateQueries({ queryKey: ["numbers"] });
    },
    onError: (error) => invalidateAndToast(error, "Unable to request another code"),
  });

  const refundMutation = useMutation({
    mutationFn: requestRefund,
    onSuccess: (_result, numberId) => {
      setPendingRefunds((prev) => ({ ...prev, [numberId]: true }));
      toast.success("Refund requested — under review");
      void queryClient.invalidateQueries({ queryKey: ["numbers"] });
    },
    onError: (error) => invalidateAndToast(error, "Unable to request refund"),
  });

  const handleGetOtp = async (numberId: string) => {
    try {
      const result = await getOtp.mutateAsync(numberId);
      setOtpByNumber((prev) => ({ ...prev, [numberId]: result }));
      if (result.waiting) {
        toast.info("Waiting for OTP...");
      } else {
        toast.success("OTP fetched");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to fetch OTP"
      );
    }
  };

  const handleCancel = (numberId: string) => {
    if (window.confirm("Cancel this activation? The number will stop receiving SMS.")) {
      cancelMutation.mutate(numberId);
    }
  };

  const handleRefund = (numberId: string) => {
    if (
      window.confirm(
        "Request a refund for this number? It has not received an OTP yet and the request goes to an admin for review."
      )
    ) {
      refundMutation.mutate(numberId);
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading numbers..." variant="grid" rows={6} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load your numbers." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Active Numbers" description="Numbers you have purchased" />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No active numbers"
          description="Buy a number from the dashboard to get started."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((number) => {
              const otpResult = otpByNumber[number.id];
              const storedMessage = number.otpMessages?.[0];
              const latestOtp = otpResult?.otp ?? storedMessage?.otpCode ?? null;
              const isSmsbowerActivation = !!number.activationStatus;
              const isActive = !["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(
                number.status
              );
              const isImported = number.product?.source === "IMPORTED";
              const refundStatus: RefundStatus | null =
                pendingRefunds[number.id]
                  ? "PENDING"
                  : (number.refundStatus ?? null);
              const canRefund = isImported && isActive && !latestOtp && !refundStatus;

              return (
                <div
                  key={number.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate font-mono text-base font-semibold text-foreground sm:text-lg">
                        {number.phoneNumber}
                      </span>
                      <CopyButton
                        value={number.phoneNumber}
                        label=""
                        className="shrink-0 p-1.5"
                        title="Copy number"
                      />
                    </div>
                    <StatusBadge status={number.status} />
                  </div>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    {number.service ?? number.product?.service ?? "Unknown service"} •{" "}
                    {number.country ?? number.product?.country ?? "Unknown country"}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    <span>OTPs received: {number.otpCount}</span>
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
                  {isSmsbowerActivation && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Activation:</span>
                      <StatusBadge status={number.activationStatus ?? ""} />
                    </div>
                  )}
                  {latestOtp ? (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          Latest OTP
                        </p>
                        <p className="mt-0.5 break-all font-mono text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                          {latestOtp}
                        </p>
                      </div>
                      <CopyButton
                        value={latestOtp}
                        label=""
                        title="Copy OTP"
                        className="shrink-0 p-1.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                      />
                    </div>
                  ) : otpResult?.message ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-500/20 dark:bg-slate-500/10">
                      <p className="text-xs font-medium text-muted-foreground">
                        Latest message (no code found)
                      </p>
                      <p className="mt-0.5 break-words text-sm text-foreground">
                        {otpResult.message.rawMessage}
                      </p>
                    </div>
                  ) : otpResult?.waiting ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                      Waiting for OTP...
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      isLoading={getOtp.isPending && getOtp.variables === number.id}
                      disabled={!isActive}
                      onClick={() => void handleGetOtp(number.id)}
                    >
                      Get OTP
                    </Button>
                    {isSmsbowerActivation && isActive && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => refreshMutation.mutate(number.id)}
                          isLoading={refreshMutation.isPending && refreshMutation.variables === number.id}
                          title="Refresh status"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Refresh
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => retryMutation.mutate(number.id)}
                          isLoading={retryMutation.isPending && retryMutation.variables === number.id}
                          title="Request another code"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          New code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancel(number.id)}
                          isLoading={cancelMutation.isPending && cancelMutation.variables === number.id}
                          title="Cancel activation"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                  {canRefund && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full text-destructive hover:text-destructive"
                      isLoading={refundMutation.isPending && refundMutation.variables === number.id}
                      onClick={() => handleRefund(number.id)}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Request refund (no OTP received)
                    </Button>
                  )}
                  {refundStatus && (
                    <p
                      className={`mt-2 text-center text-xs font-medium ${
                        refundStatus === "REJECTED"
                          ? "text-destructive"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {refundStatus === "APPROVED" || refundStatus === "COMPLETED"
                        ? "Refund was processed"
                        : refundStatus === "REJECTED"
                          ? "Refund request was rejected"
                          : "Refund requested — under review"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}