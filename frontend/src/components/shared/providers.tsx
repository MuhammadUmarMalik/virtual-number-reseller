"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/query-client";
import { getCurrentUser } from "@/services/auth.service";
import {
  clearAuthStorage,
  getAccessToken,
} from "@/lib/auth-storage";
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
        const accessToken = getAccessToken();
        if (!accessToken) return;
        const user = await getCurrentUser();
        if (!cancelled) {
          setAuth(user, accessToken);
        }
      } catch {
        if (!cancelled) {
          clearAuthStorage();
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
