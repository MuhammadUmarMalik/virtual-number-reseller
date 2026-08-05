"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { getOtpHistory } from "@/services/otp.service";

export default function OtpHistoryPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["otp-history", page],
    queryFn: () => getOtpHistory({ page, limit: 20 }),
  });

  if (query.isLoading) {
    return <LoadingState label="Loading OTP history..." />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load OTP history." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="OTP History"
        description="OTPs received on your numbers"
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No OTPs yet"
          description="OTPs received on your purchased numbers will appear here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">OTP</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((message) => (
                    <tr
                      key={message.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900">
                            {message.purchasedNumber?.phoneNumber ?? "—"}
                          </span>
                          {message.purchasedNumber?.phoneNumber && (
                            <CopyButton
                              value={message.purchasedNumber.phoneNumber}
                              label=""
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{message.service}</td>
                      <td className="px-4 py-3">
                        {message.otpCode ? (
                          <span className="inline-flex items-center gap-2 rounded bg-indigo-50 px-2 py-0.5 font-mono font-semibold text-indigo-700">
                            {message.otpCode}
                            <CopyButton value={message.otpCode} label="" />
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="max-w-md truncate px-4 py-3 text-slate-500">
                        {message.rawMessage}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(message.receivedAt).toLocaleString("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
