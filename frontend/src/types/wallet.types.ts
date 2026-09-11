export type WalletTransactionType =
  | "DEPOSIT"
  | "PURCHASE"
  | "REFUND"
  | "ADJUSTMENT_CREDIT"
  | "ADJUSTMENT_DEBIT"
  | "REVERSAL";

export type WalletTransactionStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED";

export interface Wallet {
  id: string;
  userId: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletSummary {
  balance: string;
  totalDeposits: string;
  totalPurchases: string;
  totalRefunds: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  status: WalletTransactionStatus;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export type PaymentMethod = "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER";

export interface PaymentAccount {
  id: string;
  title: string;
  accountName: string;
  accountNumber: string;
  paymentMethod: PaymentMethod;
  instructions?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TopupStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface TopupRequest {
  id: string;
  requestCode: string;
  userId: string;
  paymentAccountId: string;
  paymentAccount?: PaymentAccount;
  amount: string;
  currency: string;
  displayAmount?: string | null;
  senderAccount: string;
  transactionId?: string | null;
  screenshotUrl?: string | null;
  notes?: string | null;
  status: TopupStatus;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopupPayload {
  paymentAccountId: string;
  amount: number;
  currency?: string;
  displayAmount?: number;
  senderAccount?: string;
  transactionId?: string;
  screenshotUrl?: string;
  notes?: string;
}

export interface CreateTopupResult extends TopupRequest {
  whatsappUrl: string;
}
