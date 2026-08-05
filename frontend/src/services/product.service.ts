import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { Product } from "@/types/order.types";
import type { Announcement } from "@/types/content.types";

export async function getProducts(params?: {
  country?: string;
  service?: string;
  numberType?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams();

  if (params?.country) query.set("country", params.country);
  if (params?.service) query.set("service", params.service);
  if (params?.numberType) query.set("numberType", params.numberType);
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<Product>>(
    `/products${qs ? `?${qs}` : ""}`
  );
}

export async function getProduct(productId: string): Promise<Product> {
  return apiClient<Product>(`/products/${productId}`);
}

export async function getAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Announcement>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<Announcement>>(
    `/announcements${qs ? `?${qs}` : ""}`
  );
}
