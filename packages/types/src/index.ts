export type UserRole = "USER" | "SUPPORT" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BLOCKED";
export type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type CurrencyCode = "PKR";

export type ActivationStatus =
  | "RESERVED"
  | "WAITING_FOR_OTP"
  | "OTP_RECEIVED"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED";

export type WalletTransactionType =
  | "TOP_UP"
  | "PURCHASE"
  | "REFUND"
  | "ADMIN_CREDIT"
  | "ADMIN_DEBIT"
  | "REVERSAL";

export type LedgerDirection = "CREDIT" | "DEBIT";
export type PaymentProvider = "JAZZCASH" | "EASYPAISA" | "MOCK";
export type PaymentStatus = "CREATED" | "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REVERSED";

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
    requestId: string;
  };
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;

export interface Money {
  amount: string;
  currency: CurrencyCode;
}
