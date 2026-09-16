export type PurchasedNumberStatus =
  | "WAITING"
  | "ACTIVE"
  | "RECEIVED"
  | "EXPIRED"
  | "REFUNDED"
  | "DISABLED"
  | "CANCELLED";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface PurchasedNumber {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  vendorId: string;
  vendor?: string | null;
  vendorActivationId?: string | null;
  phoneNumber: string;
  vendorOrderId?: string | null;
  status: PurchasedNumberStatus;
  otpCount: number;
  country?: string | null;
  service?: string | null;
  provider?: string | null;
  activationStatus?: string | null;
  activationStartedAt?: string | null;
  activationCompletedAt?: string | null;
  cancelledAt?: string | null;
  purchasedAt: string;
  expiresAt?: string | null;
  lastCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    service: string;
    country: string;
    source?: "VENDOR" | "IMPORTED";
  } | null;
  orderStatus?: string | null;
  refundStatus?: RefundStatus | null;
  otpMessages?: OtpMessage[];
}

export interface OtpMessage {
  id: string;
  userId: string;
  purchasedNumberId: string;
  vendorMessageId?: string | null;
  service: string;
  rawMessage: string;
  otpCode?: string | null;
  messageHash: string;
  receivedAt: string;
  createdAt: string;
  purchasedNumber?: {
    id: string;
    phoneNumber: string;
  } | null;
}

export interface OtpCheckResult {
  message: string;
  otpCount: number;
  status: PurchasedNumberStatus;
  newMessages: OtpMessage[];
}

export interface NumberActionResult {
  status: string;
  activationStatus?: string | null;
  otpCount?: number;
  code?: string | null;
  cancelledAt?: string | null;
  retryResult?: string;
  refunded?: string | null;
}

export interface OtpResult {
  otpCount: number;
  status: PurchasedNumberStatus;
  waiting: boolean;
  otp: string | null;
  message: {
    id: string;
    rawMessage: string;
    otpCode: string | null;
    receivedAt: string;
  } | null;
}
