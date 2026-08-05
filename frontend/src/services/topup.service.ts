import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type {
  CreateTopupPayload,
  CreateTopupResult,
  PaymentAccount,
  TopupRequest,
} from "@/types/wallet.types";

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
  status?: string;
}): Promise<PaginatedResponse<TopupRequest>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<TopupRequest>>(
    `/topups${qs ? `?${qs}` : ""}`
  );
}

export async function getTopup(topupId: string): Promise<TopupRequest> {
  return apiClient<TopupRequest>(`/topups/${topupId}`);
}

export async function cancelTopup(topupId: string): Promise<TopupRequest> {
  return apiClient<TopupRequest>(`/topups/${topupId}/cancel`, {
    method: "POST",
  });
}
