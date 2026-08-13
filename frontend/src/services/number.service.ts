import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type {
  OtpCheckResult,
  PurchasedNumber,
} from "@/types/number.types";

export async function getActiveNumbers(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PurchasedNumber>> {
  const query = new URLSearchParams();

  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<PurchasedNumber>>(
    `/numbers${qs ? `?${qs}` : ""}`
  );
}

export async function checkOtp(numberId: string): Promise<OtpCheckResult> {
  return apiClient<OtpCheckResult>(`/numbers/${numberId}/check-otp`, {
    method: "POST",
  });
}

export async function requestAnotherSms(
  numberId: string
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/numbers/${numberId}/another-sms`, {
    method: "POST",
  });
}

export async function completeActivation(
  numberId: string
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/numbers/${numberId}/complete`, {
    method: "POST",
  });
}
