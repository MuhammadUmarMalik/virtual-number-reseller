import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { AuthUser, UserRole, UserStatus } from "@/types/auth.types";
import type {
  Announcement,
  AnnouncementType,
} from "@/types/content.types";
import type { Order, Product, RefundRequest } from "@/types/order.types";
import type {
  PaymentAccount,
  PaymentMethod,
  TopupRequest,
} from "@/types/wallet.types";

export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<AuthUser>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<AuthUser>>(
    `/admin/users${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminUser(userId: string): Promise<AuthUser> {
  return apiClient<AuthUser>(`/admin/users/${userId}`);
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<AuthUser> {
  return apiClient<AuthUser>(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AuthUser> {
  return apiClient<AuthUser>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function creditUserWallet(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  return apiClient<void>(`/admin/users/${userId}/wallet/credit`, {
    method: "POST",
    body: JSON.stringify({ amount, reason }),
  });
}

export async function debitUserWallet(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  return apiClient<void>(`/admin/users/${userId}/wallet/debit`, {
    method: "POST",
    body: JSON.stringify({ amount, reason }),
  });
}

export async function getAdminTopups(params?: {
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
    `/admin/topups${qs ? `?${qs}` : ""}`
  );
}

export async function approveTopup(topupId: string): Promise<TopupRequest> {
  return apiClient<TopupRequest>(`/admin/topups/${topupId}/approve`, {
    method: "POST",
  });
}

export async function rejectTopup(
  topupId: string,
  reason: string
): Promise<TopupRequest> {
  return apiClient<TopupRequest>(`/admin/topups/${topupId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getPaymentAccounts(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PaymentAccount>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<PaymentAccount>>(
    `/admin/payment-accounts${qs ? `?${qs}` : ""}`
  );
}

export interface CreatePaymentAccountPayload {
  title: string;
  accountName: string;
  accountNumber: string;
  paymentMethod: PaymentMethod;
  instructions?: string;
}

export async function createPaymentAccount(
  payload: CreatePaymentAccountPayload
): Promise<PaymentAccount> {
  return apiClient<PaymentAccount>("/admin/payment-accounts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePaymentAccount(
  accountId: string,
  payload: Partial<CreatePaymentAccountPayload>
): Promise<PaymentAccount> {
  return apiClient<PaymentAccount>(`/admin/payment-accounts/${accountId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePaymentAccount(accountId: string): Promise<void> {
  return apiClient<void>(`/admin/payment-accounts/${accountId}`, {
    method: "DELETE",
  });
}

export async function getAdminProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<Product>>(
    `/admin/products${qs ? `?${qs}` : ""}`
  );
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  service: string;
  numberType: string;
  description?: string;
  sellingPrice: number;
  refundWindowHours: number;
  availableStock: number;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<Product> {
  return apiClient<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  productId: string,
  payload: Partial<CreateProductPayload>
): Promise<Product> {
  return apiClient<Product>(`/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  return apiClient<void>(`/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export async function getAdminOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<Order>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<Order>>(
    `/admin/orders${qs ? `?${qs}` : ""}`
  );
}

export async function getAdminOrder(orderId: string): Promise<Order> {
  return apiClient<Order>(`/admin/orders/${orderId}`);
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return apiClient<Order>(`/admin/orders/${orderId}/cancel`, {
    method: "POST",
  });
}

export async function retryOrder(orderId: string): Promise<Order> {
  return apiClient<Order>(`/admin/orders/${orderId}/retry`, {
    method: "POST",
  });
}

export async function refundOrder(
  orderId: string,
  reason: string
): Promise<RefundRequest> {
  return apiClient<RefundRequest>(`/admin/orders/${orderId}/refund`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminRefunds(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<RefundRequest>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  return apiClient<PaginatedResponse<RefundRequest>>(
    `/admin/refunds${qs ? `?${qs}` : ""}`
  );
}

export async function approveRefund(refundId: string): Promise<RefundRequest> {
  return apiClient<RefundRequest>(`/admin/refunds/${refundId}/approve`, {
    method: "POST",
  });
}

export async function rejectRefund(
  refundId: string,
  reason: string
): Promise<RefundRequest> {
  return apiClient<RefundRequest>(`/admin/refunds/${refundId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getAdminAnnouncements(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Announcement>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<Announcement>>(
    `/admin/announcements${qs ? `?${qs}` : ""}`
  );
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  type: AnnouncementType;
  isPublished?: boolean;
  expiresAt?: string;
}

export async function createAnnouncement(
  payload: CreateAnnouncementPayload
): Promise<Announcement> {
  return apiClient<Announcement>("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAnnouncement(
  announcementId: string,
  payload: Partial<CreateAnnouncementPayload>
): Promise<Announcement> {
  return apiClient<Announcement>(`/admin/announcements/${announcementId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAnnouncement(
  announcementId: string
): Promise<void> {
  return apiClient<void>(`/admin/announcements/${announcementId}`, {
    method: "DELETE",
  });
}

export async function getAdminSettings(): Promise<
  Record<string, string>
> {
  return apiClient<Record<string, string>>("/admin/settings");
}

export async function updateAdminSettings(
  settings: Record<string, string>
): Promise<Record<string, string>> {
  return apiClient<Record<string, string>>("/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
}
