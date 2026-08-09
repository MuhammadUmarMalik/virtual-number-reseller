import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { Notification } from "@/types/notification.types";

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Notification>> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<Notification>>(
    `/notifications${qs ? `?${qs}` : ""}`
  );
}

export async function getUnreadNotificationCount(): Promise<number> {
  const data = await apiClient<{ count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  await apiClient<void>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient<void>("/notifications/read-all", {
    method: "PATCH",
  });
}
