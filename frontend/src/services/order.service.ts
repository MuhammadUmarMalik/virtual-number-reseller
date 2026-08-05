import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { CreateOrderPayload, Order } from "@/types/order.types";

export async function createOrder(
  payload: CreateOrderPayload
): Promise<Order> {
  return apiClient<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ""}`);
}

export async function getOrder(orderId: string): Promise<Order> {
  return apiClient<Order>(`/orders/${orderId}`);
}
