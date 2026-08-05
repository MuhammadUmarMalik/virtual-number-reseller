export type AnnouncementType =
  | "GENERAL"
  | "STOCK"
  | "PRICE_UPDATE"
  | "MAINTENANCE"
  | "SERVICE_ISSUE";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  isPublished: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "TOPUP"
  | "ORDER"
  | "OTP"
  | "REFUND"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  walletBalance: string;
  totalOrders: number;
  activeNumbers: number;
  otpCount: number;
  availableProducts: ProductSummary[];
  recentOrders: RecentOrder[];
}

export interface ProductSummary {
  id: string;
  name: string;
  country: string;
  service: string;
  numberType: string;
  sellingPrice: string;
  availableStock: number;
}

export interface RecentOrder {
  id: string;
  orderCode: string;
  total: string;
  status: string;
  createdAt: string;
}

export interface AdminDashboardData {
  totalUsers: number;
  totalOrders: number;
  pendingTopups: number;
  pendingRefunds: number;
  totalDeposits: string;
  totalPurchases: string;
  availableStock: number;
}
