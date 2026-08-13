import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { userRepository } from "../repositories/user.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { topupRepository } from "../repositories/topup.repository.js";
import { refundRepository } from "../repositories/refund.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { creditWallet, debitWallet } from "./wallet-ops.js";
import { vendorService } from "./vendor.service.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import { settingsService } from "./settings.service.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

function serializeUser(user: Record<string, unknown> & {
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const { passwordHash: _ph, ...rest } = user;
  return {
    ...rest,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const adminService = {
  async dashboard() {
    const [
      totalUsers,
      totalOrders,
      pendingTopups,
      pendingRefunds,
      totalDepositsAgg,
      totalPurchasesAgg,
      availableStockAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.topupRequest.count({ where: { status: "PENDING" } }),
      prisma.refundRequest.count({ where: { status: "PENDING" } }),
      prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "DEPOSIT" },
      }),
      prisma.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "PURCHASE" },
      }),
      prisma.product.aggregate({ _sum: { availableStock: true } }),
    ]);

    let vendorBalance: number | null = null;
    try {
      const balance = await vendorService.getVendorBalance("SMSBOWER");
      vendorBalance = Number(balance.balance);
      if (!Number.isFinite(vendorBalance)) vendorBalance = null;
    } catch {
      vendorBalance = null;
    }

    return {
      totalUsers,
      totalOrders,
      pendingTopups,
      pendingRefunds,
      totalDeposits: toString(totalDepositsAgg._sum.amount ?? new Prisma.Decimal(0)),
      totalPurchases: toString(totalPurchasesAgg._sum.amount ?? new Prisma.Decimal(0)),
      availableStock: availableStockAgg._sum.availableStock ?? 0,
      vendorBalance,
    };
  },

  async listUsers(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      userRepository.count(params),
      userRepository.list(params),
    ]);

    return buildPagination(items.map(serializeUser), total, { page, limit });
  },

  async getUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return serializeUser(user);
  },

  async updateUserStatus(userId: string, status: string, adminId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updated = await userRepository.update(userId, {
      status: status as "ACTIVE" | "SUSPENDED" | "BLOCKED",
    });

    await createAuditLog(prisma, {
      adminId,
      action: "USER_STATUS_CHANGE",
      entityType: "User",
      entityId: userId,
      oldValue: { status: user.status },
      newValue: { status },
    });

    return serializeUser(updated);
  },

  async updateUserRole(userId: string, role: string, adminId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updated = await userRepository.update(userId, {
      role: role as "USER" | "ADMIN",
    });

    await createAuditLog(prisma, {
      adminId,
      action: "USER_ROLE_CHANGE",
      entityType: "User",
      entityId: userId,
      oldValue: { role: user.role },
      newValue: { role },
    });

    return serializeUser(updated);
  },

  async creditUserWallet(userId: string, amount: number, reason: string, adminId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const mutation = await creditWallet(tx, {
        userId,
        amount,
        type: "ADJUSTMENT_CREDIT",
        description: reason,
        createdBy: adminId,
      });

      await createNotification(tx, {
        userId,
        title: "Wallet credited",
        message: `Rs. ${amount} has been added to your wallet. ${reason}`,
        type: "TOPUP",
      });

      await createAuditLog(tx, {
        adminId,
        action: "WALLET_CREDIT",
        entityType: "Wallet",
        entityId: mutation.walletId,
        newValue: { amount, reason, balanceAfter: toString(mutation.balanceAfter) },
      });

      return mutation;
    });

    return result;
  },

  async debitUserWallet(userId: string, amount: number, reason: string, adminId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const mutation = await debitWallet(tx, {
        userId,
        amount,
        type: "ADJUSTMENT_DEBIT",
        description: reason,
        createdBy: adminId,
      });

      await createNotification(tx, {
        userId,
        title: "Wallet debited",
        message: `Rs. ${amount} has been deducted from your wallet. ${reason}`,
        type: "SYSTEM",
      });

      await createAuditLog(tx, {
        adminId,
        action: "WALLET_DEBIT",
        entityType: "Wallet",
        entityId: mutation.walletId,
        newValue: { amount, reason, balanceAfter: toString(mutation.balanceAfter) },
      });

      return mutation;
    });

    return result;
  },

  async listTopups(params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      topupRepository.countAll(params),
      topupRepository.listAll(params),
    ]);

    return buildPagination(
      items.map((item) => ({ ...item, amount: toString(item.amount) })),
      total,
      { page, limit }
    );
  },

  async listOrders(params: { page: number; limit: number; status?: string; userId?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      orderRepository.countAll(params),
      orderRepository.listAll(params),
    ]);

    const serializeOrder = (order: {
      subtotal: { toString(): string };
      total: { toString(): string };
      completedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    } & Record<string, unknown>) => ({
      ...order,
      subtotal: toString(order.subtotal),
      total: toString(order.total),
      completedAt: order.completedAt ? order.completedAt.toISOString() : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });

    return buildPagination(items.map(serializeOrder), total, { page, limit });
  },

  async getOrder(orderId: string) {
    const order = await orderRepository.findById(orderId, true);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return order;
  },

  async listRefunds(params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      refundRepository.countAll(params),
      refundRepository.listAll(params),
    ]);

    return buildPagination(items, total, { page, limit });
  },

  async listPaymentAccounts(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      topupRepository.countPaymentAccounts(),
      topupRepository.listPaymentAccounts(params),
    ]);

    return buildPagination(items, total, { page, limit });
  },

  async createPaymentAccount(input: {
    title: string;
    accountName: string;
    accountNumber: string;
    paymentMethod: string;
    instructions?: string;
  }) {
    return topupRepository.createPaymentAccount({
      title: input.title,
      accountName: input.accountName,
      accountNumber: input.accountNumber,
      paymentMethod: input.paymentMethod as "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER",
      instructions: input.instructions || null,
    });
  },

  async updatePaymentAccount(
    accountId: string,
    input: Partial<{
      title: string;
      accountName: string;
      accountNumber: string;
      paymentMethod: string;
      instructions?: string;
      isActive: boolean;
    }>
  ) {
    const existing = await topupRepository.findPaymentAccountById(accountId);
    if (!existing) {
      throw new AppError("Payment account not found", 404);
    }

    return topupRepository.updatePaymentAccount(accountId, {
      ...input,
      paymentMethod: input.paymentMethod as "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER" | undefined,
    });
  },

  async deletePaymentAccount(accountId: string) {
    const existing = await topupRepository.findPaymentAccountById(accountId);
    if (!existing) {
      throw new AppError("Payment account not found", 404);
    }
    await topupRepository.deletePaymentAccount(accountId);
  },

  async listProducts(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      productRepository.count(params as never),
      productRepository.list(params as never),
    ]);

    return buildPagination(
      items.map((product) => {
        const item = product as Record<string, unknown>;
        return {
          ...item,
          sellingPrice: toString(product.sellingPrice),
          vendorCost: toString(product.vendorCost),
        };
      }),
      total,
      { page, limit }
    );
  },

  async syncProductStock(productId: string, adminId: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    let available = 0;
    let notAvailable = false;

    if (product.vendor !== "SMSBOWER") {
      throw new AppError(
        `Vendor ${product.vendor} is not supported. Only SMSBower products can be synced.`,
        400
      );
    }

    const vendorCountryId = (product.vendorCountryId ?? product.countryCode ?? "").trim();
    if (!/^\d+$/.test(vendorCountryId)) {
      await productRepository.update(product.id, {
        needsSync: true,
        availableStock: 0,
        status: "OUT_OF_STOCK",
      });
      throw new AppError(
        "This product has no valid vendor country mapping. Re-sync it from the vendor to fix its country.",
        409
      );
    }
    const availability = await vendorService.vendorRouter.checkAvailability(
      "SMSBOWER",
      vendorCountryId,
      product.service,
      product.vendorProviderId ?? undefined
    );

    if (availability.length === 0) {
      notAvailable = true;
    } else {
      available = availability.reduce((sum, a) => sum + a.count, 0);
    }

    const updated = await productRepository.update(productId, {
      availableStock: available,
      lastSyncedAt: new Date(),
      status: notAvailable ? "OUT_OF_STOCK" : "ACTIVE",
    });

    await createAuditLog(prisma, {
      adminId,
      action: "PRODUCT_SYNC_STOCK",
      entityType: "Product",
      entityId: productId,
      newValue: {
        availableStock: available,
        notAvailable,
      },
    });

    const { secretKey: _sk, ...rest } = updated as Record<string, unknown>;
    return {
      ...rest,
      sellingPrice: toString(updated.sellingPrice),
      vendorCost: toString(updated.vendorCost),
      syncedAt: new Date(),
      notAvailable,
    };
  },

  async getSettings() {
    return settingsService.getAll();
  },

  async updateSettings(entries: Record<string, string>) {
    return settingsService.updateAll(entries);
  },

  async cancelOrder(orderId: string, adminId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    if (order.status === "COMPLETED" || order.status === "REFUNDED") {
      throw new AppError("Completed orders cannot be cancelled", 400);
    }

    const updated = await orderRepository.updateStatus(orderId, {
      status: "FAILED",
      failureReason: "Cancelled by admin",
    });

    await createAuditLog(prisma, {
      adminId,
      action: "ORDER_CANCEL",
      entityType: "Order",
      entityId: orderId,
      newValue: { status: "FAILED" },
    });

    return updated;
  },

  async retryOrder(orderId: string, adminId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    if (order.status !== "FAILED" && order.status !== "EXPIRED") {
      throw new AppError("Only failed or expired orders can be retried", 400);
    }

    const updated = await orderRepository.updateStatus(orderId, {
      status: "PROCESSING",
      failureReason: null,
    });

    await createAuditLog(prisma, {
      adminId,
      action: "ORDER_RETRY",
      entityType: "Order",
      entityId: orderId,
      newValue: { status: "PROCESSING" },
    });

    return updated;
  },

  async createAdminRefund(orderId: string, reason: string, adminId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const existing = await refundRepository.findByOrderId(orderId, order.userId);
    if (existing) {
      throw new AppError("A refund request already exists for this order", 409);
    }

    const refund = await refundRepository.create({
      userId: order.userId,
      orderId,
      reason,
      amount: order.total,
      status: "PENDING",
    });

    await createNotification(prisma, {
      userId: order.userId,
      title: "Refund initiated",
      message: `A refund has been initiated for order ${order.orderCode}.`,
      type: "REFUND",
    });

    await createAuditLog(prisma, {
      adminId,
      action: "ORDER_REFUND_CREATE",
      entityType: "RefundRequest",
      entityId: refund.id,
      newValue: { reason },
    });

    return refund;
  },
};
