"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/query-client";
import { verifySession } from "@/services/auth.service";
import { getAccessToken } from "@/lib/auth-storage";
import { getExchangeRates } from "@/services/currency.service";
import { useAuthStore } from "@/store/auth.store";
import { useCurrencyStore } from "@/store/currency.store";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setRates = useCurrencyStore((state) => state.setRates);

  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const data = await getExchangeRates();
        if (!cancelled) {
          // Rates are per-USD, so keep USD pinned at 1 even if a partial
          // or empty sync is returned.
          setRates({ USD: 1, ...data.rates }, data.updatedAt);
        }
      } catch {
        // Keep whatever rates are already in the store; never block pricing.
      }
    }

    void loadRates();

    return () => {
      cancelled = true;
    };
  }, [setRates]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        // Reads the HttpOnly access_token cookie set by the backend; the
        // in-memory copy is only present after a sign-in in this tab.
        const user = await verifySession();
        if (!cancelled && user) {
          setAuth(user, getAccessToken() ?? "");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
