import type { Wallet } from "@prisma/client";
import { prisma } from "../config/database.js";

export const dashboardRepository = {
  findWallet(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({ where: { userId } });
  },

  countOrders(userId: string): Promise<number> {
    return prisma.order.count({ where: { userId } });
  },

  countActiveNumbers(userId: string): Promise<number> {
    return prisma.purchasedNumber.count({
      where: {
        userId,
        status: { notIn: ["EXPIRED", "REFUNDED", "DISABLED"] },
      },
    });
  },

  countOtpMessages(userId: string): Promise<number> {
    return prisma.otpMessage.count({ where: { userId } });
  },

  findAvailableProducts(limit: number) {
    return prisma.product.findMany({
      where: {
        status: "ACTIVE",
        availableStock: { gt: 0 },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        name: true,
        country: true,
        service: true,
        numberType: true,
        sellingPrice: true,
        availableStock: true,
      },
    });
  },

  findRecentOrders(userId: string, limit: number) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        orderCode: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });
  },
};
