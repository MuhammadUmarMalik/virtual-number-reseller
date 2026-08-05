import { apiClient } from "@/lib/api-client";
import type {
  AdminDashboardData,
  DashboardData,
} from "@/types/content.types";

export async function getDashboard(): Promise<DashboardData> {
  return apiClient<DashboardData>("/dashboard");
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiClient<AdminDashboardData>("/admin/dashboard");
}
