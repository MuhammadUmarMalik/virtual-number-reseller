"use client";

import { useState } from "react";
import { BellOff, CheckCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/types/notification.types";

const TYPE_BADGE: Record<NotificationType, string> = {
  TOPUP: "success",
  ORDER: "default",
  OTP: "info",
  REFUND: "warning",
  SYSTEM: "neutral",
} as const;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1);

  const query = useNotifications({ page, limit: 20 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (query.isLoading) {
    return (
      <LoadingState label="Loading notifications..." variant="table" rows={5} />
    );
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load notifications." />;
  }

  const data = query.data;
  const unreadCount = data.items.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates on your orders, OTPs, wallet, and refunds"
        actions={
          unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {data.items.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-6 w-6" />}
          title="No notifications"
          description="Notifications about your orders, OTPs, wallet, and refunds will appear here."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {data.items.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-4 transition-colors hover:bg-muted/40",
                    !notification.isRead && "bg-primary/[0.03]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={TYPE_BADGE[notification.type] as "success" | "default" | "info" | "warning" | "neutral"}>
                        {notification.type}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="neutral">New</Badge>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </li>
              ))}
            </ul>
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
