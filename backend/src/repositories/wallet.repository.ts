import { prisma } from "../config/database.js";
import type { Prisma, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";

export const walletRepository = {
  findByUserId(userId: string) {
    return prisma.wallet.findUnique({ where: { userId } });
  },

  listTransactions(userId: string, params: { page: number; limit: number; type?: string; status?: string }) {
    const where: Prisma.WalletTransactionWhereInput = { userId };

    if (params.type) where.type = params.type as WalletTransactionType;
    if (params.status) where.status = params.status as WalletTransactionStatus;

    return prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countTransactions(userId: string, params: { type?: string; status?: string }) {
    const where: Prisma.WalletTransactionWhereInput = { userId };

    if (params.type) where.type = params.type as WalletTransactionType;
    if (params.status) where.status = params.status as WalletTransactionStatus;

    return prisma.walletTransaction.count({ where });
  },

  sumByType(userId: string, type: WalletTransactionType) {
    return prisma.walletTransaction.aggregate({
      where: { userId, type },
      _sum: { amount: true },
    });
  },
};
