import { walletRepository } from "../repositories/wallet.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

function sumToAmount(sum: { _sum: { amount: { toString(): string } | null } } | null): string {
  return sum?._sum.amount != null ? toString(sum._sum.amount) : "0";
}

export const walletService = {
  async getWalletSummary(userId: string) {
    const wallet = await walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new AppError("Wallet not found", 404);
    }

    const [deposits, purchases, refunds] = await Promise.all([
      walletRepository.sumByType(userId, "DEPOSIT"),
      walletRepository.sumByType(userId, "PURCHASE"),
      walletRepository.sumByType(userId, "REFUND"),
    ]);

    return {
      balance: toString(wallet.balance),
      totalDeposits: sumToAmount(deposits),
      totalPurchases: sumToAmount(purchases),
      totalRefunds: sumToAmount(refunds),
    };
  },

  async listTransactions(userId: string, params: {
    page: number;
    limit: number;
    type?: string;
    status?: string;
  }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      walletRepository.countTransactions(userId, params),
      walletRepository.listTransactions(userId, params),
    ]);

    return buildPagination(items, total, { page, limit });
  },
};
