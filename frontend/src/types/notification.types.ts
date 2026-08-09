export type NotificationType = "TOPUP" | "ORDER" | "OTP" | "REFUND" | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
