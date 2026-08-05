import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/api.types";
import type { OtpMessage } from "@/types/number.types";

export async function getOtpHistory(params?: {
  number?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<OtpMessage>> {
  const query = new URLSearchParams();

  if (params?.number) query.set("number", params.number);
  if (params?.service) query.set("service", params.service);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString();
  return apiClient<PaginatedResponse<OtpMessage>>(
    `/otp-history${qs ? `?${qs}` : ""}`
  );
}

export async function getOtp(otpId: string): Promise<OtpMessage> {
  return apiClient<OtpMessage>(`/otp-history/${otpId}`);
}
