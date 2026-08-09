"use client";

import { Bell, CheckCheck } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
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

export function NotificationBell() {
  const router = useRouter();
  const unread = useUnreadNotificationCount();
  const notifications = useNotifications({ page: 1, limit: 5 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unread.data ?? 0;
  const items = notifications.data?.items ?? [];

  const handleOpenNotification = (notificationId: string) => {
    if (!notificationId) return;
    markRead.mutate(notificationId);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 overflow-hidden rounded-xl border border-border bg-card p-0 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {!notifications.isLoading && items.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet
                </p>
              </div>
            )}

            {items.length > 0 && (
              <ul className="divide-y divide-border">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification.id)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                        !notification.isRead && "bg-primary/[0.03]"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={TYPE_BADGE[notification.type] as "success" | "default" | "info" | "warning" | "neutral"}>
                            {notification.type}
                          </Badge>
                          {!notification.isRead && (
                            <span
                              aria-label="Unread"
                              className="h-2 w-2 shrink-0 rounded-full bg-primary"
                            />
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <DropdownMenu.Item
              onSelect={(event) => {
                event.preventDefault();
                router.push("/notifications");
              }}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-primary outline-none transition-colors hover:bg-muted/40 data-[highlighted]:bg-muted/40"
            >
              View all notifications
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
