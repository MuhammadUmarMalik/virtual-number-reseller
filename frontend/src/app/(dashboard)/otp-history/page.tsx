"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";

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
    return <LoadingState label="Loading OTP history..." variant="table" rows={5} />;
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
          icon={<Inbox className="h-6 w-6" />}
          title="No OTPs yet"
          description="OTPs received on your purchased numbers will appear here."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card sm:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground">
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
                      <td className="px-4 py-3 text-muted-foreground">{message.service}</td>
                      <td className="px-4 py-3">
                        {message.otpCode ? (
                          <span className="inline-flex items-center gap-2 rounded bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
                            {message.otpCode}
                            <CopyButton value={message.otpCode} label="" />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="max-w-md truncate px-4 py-3 text-muted-foreground">
                        {message.rawMessage}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
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

          <ul className="divide-y divide-border sm:hidden">
            {data.items.map((message) => (
              <li key={message.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-foreground">
                      {message.purchasedNumber?.phoneNumber ?? "—"}
                    </p>
                    {message.purchasedNumber?.phoneNumber && (
                      <CopyButton value={message.purchasedNumber.phoneNumber} label="" />
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {message.service}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {message.otpCode ? (
                    <p className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
                      {message.otpCode}
                      <CopyButton value={message.otpCode} label="" />
                    </p>
                  ) : (
                    <p className="text-muted-foreground">—</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(message.receivedAt).toLocaleString("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>

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
