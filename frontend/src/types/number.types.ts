export type PurchasedNumberStatus =
  | "WAITING"
  | "ACTIVE"
  | "RECEIVED"
  | "EXPIRED"
  | "REFUNDED"
  | "DISABLED";

export interface PurchasedNumber {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  vendorId: string;
  phoneNumber: string;
  vendorOrderId?: string | null;
  status: PurchasedNumberStatus;
  otpCount: number;
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
  } | null;
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
