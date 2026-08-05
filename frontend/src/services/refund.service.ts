import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { RefundRequest } from "@/types/order.types";

export async function createRefund(
  orderId: string,
  reason: string
): Promise<RefundRequest> {
  return apiClient<RefundRequest>("/refunds", {
    method: "POST",
    body: JSON.stringify({ orderId, reason }),
  });
}

export async function getRefunds(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<RefundRequest>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<RefundRequest>>(
    `/refunds${qs ? `?${qs}` : ""}`
  );
}

export async function getRefund(refundId: string): Promise<RefundRequest> {
  return apiClient<RefundRequest>(`/refunds/${refundId}`);
}
