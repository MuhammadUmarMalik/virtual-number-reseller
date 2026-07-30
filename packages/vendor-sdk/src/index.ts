import { z } from "zod";
import type { ActivationStatus } from "@number-reseller/types";

export interface AvailabilityInput {
  serviceCode: string;
  countryIsoCode: string;
}

export interface AvailabilityResult {
  available: boolean;
  quantity: number | null;
  vendorCost: string;
}

export interface ReserveNumberInput extends AvailabilityInput {
  idempotencyKey: string;
}

export interface ReserveNumberResult {
  phoneNumber: string;
  otpEndpoint: URL;
  vendorActivationId: string | null;
  status: Extract<ActivationStatus, "RESERVED" | "WAITING_FOR_OTP">;
}

export interface GetOtpInput {
  vendorActivationId: string | null;
  otpEndpoint: URL;
}

export interface GetOtpResult {
  status: ActivationStatus;
  otp: string | null;
  receivedAt: Date | null;
}

export interface CancelActivationInput {
  vendorActivationId: string | null;
  reason: string;
}

export interface CancelResult {
  cancelled: boolean;
  refundable: boolean;
}

export interface StatusInput {
  vendorActivationId: string | null;
}

export interface StatusResult {
  status: ActivationStatus;
  refundable: boolean;
}

export interface NumberVendorAdapter {
  getAvailability(input: AvailabilityInput): Promise<AvailabilityResult>;
  reserveNumber(input: ReserveNumberInput): Promise<ReserveNumberResult>;
  getOtp(input: GetOtpInput): Promise<GetOtpResult>;
  cancelActivation(input: CancelActivationInput): Promise<CancelResult>;
  getActivationStatus(input: StatusInput): Promise<StatusResult>;
}

export class VendorResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VendorResponseError";
  }
}

const e164UsPhoneSchema = z.string().regex(/^1[2-9]\d{9}$/);

export function parseVendorReservationResponse(
  rawResponse: string,
  allowedHostnames: string[],
  requireHttps: boolean,
): ReserveNumberResult {
  const parts = rawResponse.trim().split("|");

  if (parts.length !== 2) {
    throw new VendorResponseError("Invalid vendor response format");
  }

  const [phoneNumber, rawUrl] = parts;
  if (!phoneNumber || !e164UsPhoneSchema.safeParse(phoneNumber).success) {
    throw new VendorResponseError("Invalid vendor phone number");
  }

  let otpEndpoint: URL;
  try {
    otpEndpoint = new URL(rawUrl ?? "");
  } catch {
    throw new VendorResponseError("Invalid vendor OTP endpoint URL");
  }

  if (requireHttps && otpEndpoint.protocol !== "https:") {
    throw new VendorResponseError("Vendor OTP endpoint must use HTTPS");
  }

  if (!allowedHostnames.includes(otpEndpoint.hostname)) {
    throw new VendorResponseError("Vendor OTP endpoint hostname is not allowed");
  }

  const vendorActivationId = otpEndpoint.pathname.split("/").filter(Boolean).at(-1) ?? null;

  return {
    phoneNumber,
    otpEndpoint,
    vendorActivationId,
    status: "WAITING_FOR_OTP"
  };
}

export class MockVendorAdapter implements NumberVendorAdapter {
  async getAvailability(): Promise<AvailabilityResult> {
    return { available: true, quantity: 100, vendorCost: "120.00" };
  }

  async reserveNumber(input: ReserveNumberInput): Promise<ReserveNumberResult> {
    const suffix = input.idempotencyKey.replace(/\D/g, "").slice(-4).padStart(4, "0");
    return parseVendorReservationResponse(
      `1463302${suffix}|https://vendor.example.com/sms/${input.serviceCode}/${input.idempotencyKey}`,
      ["vendor.example.com"],
      true,
    );
  }

  async getOtp(input: GetOtpInput): Promise<GetOtpResult> {
    return {
      status: input.vendorActivationId ? "OTP_RECEIVED" : "WAITING_FOR_OTP",
      otp: input.vendorActivationId ? "123456" : null,
      receivedAt: input.vendorActivationId ? new Date() : null
    };
  }

  async cancelActivation(): Promise<CancelResult> {
    return { cancelled: true, refundable: true };
  }

  async getActivationStatus(): Promise<StatusResult> {
    return { status: "WAITING_FOR_OTP", refundable: true };
  }
}
