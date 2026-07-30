"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "./api";

export interface WalletBalance {
  balance: string;
  currency: string;
  walletId: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: string;
  direction: string;
  balanceBefore: string;
  balanceAfter: string;
  status: string;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
  description: string | null;
  metadata: unknown;
  paymentId: string | null;
  createdAt: string;
}

export interface PaginatedTransactions {
  transactions: WalletTransaction[];
  nextCursor: string | null;
  totalCount: number;
}

export interface ReconciliationResult {
  walletBalance: string;
  computedBalance: string;
  totalCredits: string;
  totalDebits: string;
  matches: boolean;
  version: number;
  currency: string;
}

export interface WalletResult {
  balance: string;
  currency: string;
  transaction: WalletTransaction;
}

export function useWalletBalance() {
  const [data, setData] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<WalletBalance>("/api/wallet");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useTransactions(filters: {
  type?: string; search?: string; from?: string; to?: string; cursor?: string; take?: number;
} = {}) {
  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async (overrideFilters?: typeof filters) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    const active = { ...filters, ...overrideFilters };
    const params = new URLSearchParams();
    if (active.type) params.set("type", active.type);
    if (active.search) params.set("search", active.search);
    if (active.from) params.set("from", active.from);
    if (active.to) params.set("to", active.to);
    if (active.cursor) params.set("cursor", active.cursor);
    if (active.take) params.set("take", String(active.take));

    try {
      const result = await apiRequest<PaginatedTransactions>(
        `/api/wallet/transactions?${params.toString()}`,
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export interface CreateTopUpResult {
  paymentId: string;
  status: string;
  merchantReference: string;
  redirectUrl?: string;
  formFields?: Record<string, string>;
}

export interface PaymentInfo {
  id: string;
  provider: string;
  amount: string;
  currency: string;
  status: string;
  merchantReference: string;
  providerTransactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayments {
  payments: Array<{
    id: string;
    provider: string;
    amount: string;
    currency: string;
    status: string;
    merchantReference: string;
    createdAt: string;
  }>;
  nextCursor: string | null;
  totalCount: number;
}

export function useTopUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateTopUpResult | null>(null);

  const submit = useCallback(async (provider: string, amount: number, idempotencyKey: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiRequest<CreateTopUpResult>("/api/payments/top-up", {
        method: "POST",
        body: JSON.stringify({ provider, amount, idempotencyKey }),
      });
      setResult(res);
      return res;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create top-up");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return { submit, loading, error, result, reset };
}

export function usePayment(paymentId: string | null) {
  const [data, setData] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<PaymentInfo>(`/api/payments/${paymentId}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function usePayments(cursor?: string, take = 20) {
  const [data, setData] = useState<PaginatedPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (take) params.set("take", String(take));

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<PaginatedPayments>(`/api/payments?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [params.toString()]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useReconciliation(userId?: string) {
  const [data, setData] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = userId ? `?userId=${userId}` : "";
      const result = await apiRequest<ReconciliationResult>(`/api/wallet/reconciliation${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation check failed");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { data, loading, error, check };
}
