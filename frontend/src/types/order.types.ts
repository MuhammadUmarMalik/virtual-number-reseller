import type { AuthUser } from "@/types/auth.types";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  service: string;
  numberType: string;
  description?: string | null;
  sellingPrice: string;
  refundWindowHours: number;
  availableStock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACTIVE"
  | "WAITING_OTP"
  | "OTP_RECEIVED"
  | "COMPLETED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "FAILED"
  | "EXPIRED";

export type OrderItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "ACTIVE"
  | "WAITING_OTP"
  | "OTP_RECEIVED"
  | "COMPLETED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "FAILED"
  | "EXPIRED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: OrderItemStatus;
  otpCount: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  subtotal: string;
  total: string;
  status: OrderStatus;
  failureReason?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  user?: AuthUser;
}

export interface CreateOrderPayload {
  productId: string;
  quantity: number;
}

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface RefundRequest {
  id: string;
  userId: string;
  orderId: string;
  order?: Order;
  reason: string;
  status: RefundStatus;
  amount: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRefundPayload {
  orderId: string;
  reason: string;
}
