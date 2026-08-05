import { apiClient } from "@/lib/api-client";
import type {
  CreateTopupPayload,
  CreateTopupResult,
  PaymentAccount,
  TopupRequest,
  WalletSummary,
  WalletTransaction,
} from "@/types/wallet.types";
import type { PaginatedResponse } from "@/types/api.types";

export async function getWallet(): Promise<WalletSummary> {
  return apiClient<WalletSummary>("/wallet");
}

export async function getWalletTransactions(params?: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<WalletTransaction>> {
  const query = new URLSearchParams();

  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<WalletTransaction>>(
    `/wallet/transactions${qs ? `?${qs}` : ""}`
  );
}

export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
  return apiClient<PaymentAccount[]>("/topups/payment-accounts");
}

export async function createTopup(
  payload: CreateTopupPayload
): Promise<CreateTopupResult> {
  return apiClient<CreateTopupResult>("/topups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTopupRequests(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<TopupRequest>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<TopupRequest>>(
    `/topups${qs ? `?${qs}` : ""}`
  );
}

export async function cancelTopup(topupId: string): Promise<TopupRequest> {
  return apiClient<TopupRequest>(`/topups/${topupId}/cancel`, {
    method: "POST",
  });
}
