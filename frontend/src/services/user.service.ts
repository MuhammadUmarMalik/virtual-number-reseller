import { apiClient } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { AppNotification } from "@/types/content.types";

export interface SessionInfo {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent?: boolean;
}

export async function getProfile(): Promise<AuthUser> {
  return apiClient<AuthUser>("/users/profile");
}

export async function updateProfile(payload: {
  fullName: string;
  email: string;
  whatsappNumber: string;
}): Promise<AuthUser> {
  return apiClient<AuthUser>("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiClient<void>("/users/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getSessions(): Promise<SessionInfo[]> {
  return apiClient<SessionInfo[]>("/users/sessions");
}

export async function removeSession(sessionId: string): Promise<void> {
  return apiClient<void>(`/users/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AppNotification>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<AppNotification>>(
    `/notifications${qs ? `?${qs}` : ""}`
  );
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  return apiClient<void>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  return apiClient<void>("/notifications/read-all", {
    method: "PATCH",
  });
}
