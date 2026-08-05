"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCheckOtp } from "@/hooks/use-active-numbers";
import { ApiError } from "@/lib/api-client";
import { getActiveNumbers } from "@/services/number.service";

export default function ActiveNumbersPage() {
  const [page, setPage] = useState(1);
  const checkOtp = useCheckOtp();

  const query = useQuery({
    queryKey: ["numbers", page],
    queryFn: () => getActiveNumbers({ page, limit: 20 }),
  });

  const handleCheckOtp = async (numberId: string) => {
    try {
      const result = await checkOtp.mutateAsync(numberId);
      if (result.otpCount === 0) {
        toast.info("No OTP received yet");
      } else {
        toast.success(`OTP received (${result.otpCount} total)`);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to check OTP"
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading numbers..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load your numbers." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Numbers"
        description="Numbers you have purchased"
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No active numbers"
          description="Buy a number from the dashboard to get started."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((number) => (
              <div
                key={number.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-slate-900">
                    {number.phoneNumber}
                  </span>
                  <StatusBadge status={number.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {number.product?.service ?? "Unknown service"} •{" "}
                  {number.product?.country ?? "Unknown country"}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>OTPs: {number.otpCount}</span>
                  <span>
                    Expires:{" "}
                    {number.expiresAt
                      ? new Date(number.expiresAt).toLocaleDateString("en-PK")
                      : "—"}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <CopyButton value={number.phoneNumber} />
                  <Button
                    type="button"
                    size="sm"
                    isLoading={checkOtp.isPending}
                    disabled={["EXPIRED", "REFUNDED", "DISABLED"].includes(
                      number.status
                    )}
                    onClick={() => void handleCheckOtp(number.id)}
                  >
                    Check OTP
                  </Button>
                </div>
              </div>
            ))}
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
