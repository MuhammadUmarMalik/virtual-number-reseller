"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getAccessToken } from "@/lib/auth-storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api/v1";

type RealtimeEventType =
  | "notification"
  | "otp"
  | "number"
  | "order"
  | "topup"
  | "refund";

const EVENT_QUERIES: Record<RealtimeEventType, string[]> = {
  notification: ["notifications"],
  otp: ["numbers", "otp-history"],
  number: ["numbers"],
  order: ["orders", "wallet", "dashboard", "admin"],
  topup: ["wallet", "payment-accounts", "topups", "admin"],
  refund: ["orders", "wallet", "refunds", "admin"],
};

const RECONNECT_DELAY_MS = 3000;

export function RealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      const token = getAccessToken();
      if (!token) return;

      const source = new EventSource(
        `${API_BASE_URL}/realtime/events?token=${encodeURIComponent(token)}`
      );
      eventSource = source;

      const handleEvent = (event: MessageEvent) => {
        if (disposed) return;
        const keys = EVENT_QUERIES[event.type as RealtimeEventType];
        if (!keys) return;
        for (const key of keys) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      };

      for (const eventName of Object.keys(EVENT_QUERIES)) {
        source.addEventListener(eventName, handleEvent);
      }

      source.onerror = () => {
        source.close();
        if (disposed) return;
        retryTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      eventSource?.close();
    };
  }, [queryClient]);

  return null;
}
