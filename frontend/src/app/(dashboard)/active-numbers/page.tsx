"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Activity, RefreshCw, RotateCw, XCircle } from "lucide-react";

import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
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
} from "@/services/number.service";
import type { OtpResult } from "@/types/number.types";

export default function ActiveNumbersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [otpByNumber, setOtpByNumber] = useState<Record<string, OtpResult>>({});
  const getOtp = useGetOtp();

  const query = useQuery({
    queryKey: ["numbers", page],
    queryFn: () => getActiveNumbers({ page, limit: 20 }),
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
    onSuccess: () => {
      toast.success("Activation cancelled");
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
              const isSmsbowerActivation = !!number.activationStatus;
              const isActive =
                !["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(
                  number.status
                );
              return (
                <div
                  key={number.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg font-semibold text-foreground">
                      {number.phoneNumber}
                    </span>
                    <StatusBadge status={number.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {number.service ?? number.product?.service ?? "Unknown service"} •{" "}
                    {number.country ?? number.product?.country ?? "Unknown country"}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>OTPs: {number.otpCount}</span>
                    <span>
                      Expires:{" "}
                      {number.expiresAt
                        ? new Date(number.expiresAt).toLocaleDateString("en-PK")
                        : "—"}
                    </span>
                  </div>
                  {isSmsbowerActivation && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Activation:</span>
                      <StatusBadge status={number.activationStatus ?? ""} />
                    </div>
                  )}
                  {otpByNumber[number.id]?.otp ? (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Latest OTP
                      </p>
                      <p className="font-mono text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                        {otpByNumber[number.id].otp}
                      </p>
                    </div>
                  ) : otpByNumber[number.id]?.waiting ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                      Waiting for OTP...
                    </div>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <CopyButton value={number.phoneNumber} />
                      <Button
                        type="button"
                        size="sm"
                        isLoading={getOtp.isPending && getOtp.variables === number.id}
                        disabled={!isActive}
                        onClick={() => void handleGetOtp(number.id)}
                      >
                        Get OTP
                      </Button>
                    </div>
                    {isSmsbowerActivation && isActive && (
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                    )}
                  </div>
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