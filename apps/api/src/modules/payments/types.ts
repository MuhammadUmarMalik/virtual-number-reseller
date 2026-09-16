import type { Prisma } from "@number-reseller/database";

export type PaymentProvider = "JAZZCASH" | "EASYPAISA" | "MOCK";
export type NormalizedPaymentStatus = "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING";

export interface CreatePaymentInput {
  merchantReference: string;
  amount: Prisma.Decimal;
  currency: string;
  userId: string;
}

export interface CreatePaymentResult {
  redirectUrl?: string;
  formFields?: Record<string, string>;
  providerTransactionId?: string;
}

export interface VerifyCallbackInput {
  rawBody: Record<string, unknown>;
  rawHeaders: Record<string, string | string[] | undefined>;
  merchantReference: string;
  expectedAmount: string;
}

export interface VerifyCallbackResult {
  verified: boolean;
  normalizedStatus: NormalizedPaymentStatus;
  providerTransactionId: string | undefined;
  paidAmount: string | undefined;
  providerResponseCode: string | undefined;
  providerResponseMessage: string | undefined;
  rawData: Record<string, unknown> | undefined;
}

export interface GetPaymentStatusInput {
  providerTransactionId: string;
}

export interface GetPaymentStatusResult {
  normalizedStatus: NormalizedPaymentStatus;
  providerTransactionId: string | undefined;
}

export interface PaymentAdapterConfig {
  merchantId?: string;
  password?: string;
  integritySalt?: string;
  storeId?: string;
  hashKey?: string;
  callbackUrl?: string;
}
