import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { AppError } from "../utils/app-error.js";

const RECENT_ORDERS_LIMIT = 5;
const AVAILABLE_PRODUCTS_LIMIT = 12;

export interface DashboardProductSummary {
  id: string;
  name: string;
  country: string;
  service: string;
  numberType: string;
  sellingPrice: string;
  availableStock: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderCode: string;
  total: string;
  status: string;
  createdAt: string;
}

export interface DashboardData {
  walletBalance: string;
  totalOrders: number;
  activeNumbers: number;
  otpCount: number;
  availableProducts: DashboardProductSummary[];
  recentOrders: DashboardRecentOrder[];
}

function toString(value: { toString(): string }): string {
  return value.toString();
}

export const dashboardService = {
  async getDashboard(userId: string): Promise<DashboardData> {
    const wallet = await dashboardRepository.findWallet(userId);
    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    const [totalOrders, activeNumbers, otpCount, products, recentOrders] =
      await Promise.all([
        dashboardRepository.countOrders(userId),
        dashboardRepository.countActiveNumbers(userId),
        dashboardRepository.countOtpMessages(userId),
        dashboardRepository.findAvailableProducts(AVAILABLE_PRODUCTS_LIMIT),
        dashboardRepository.findRecentOrders(userId, RECENT_ORDERS_LIMIT),
      ]);

    return {
      walletBalance: toString(wallet.balance),
      totalOrders,
      activeNumbers,
      otpCount,
      availableProducts: products.map((product) => ({
        id: product.id,
        name: product.name,
        country: product.country,
        service: product.service,
        numberType: product.numberType,
        sellingPrice: toString(product.sellingPrice),
        availableStock: product.availableStock,
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderCode: order.orderCode,
        total: toString(order.total),
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };
  },
};
