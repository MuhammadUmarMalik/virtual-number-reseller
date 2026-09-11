import { Prisma, type NumberStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { numberRepository } from "../repositories/number.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { topupRepository } from "../repositories/topup.repository.js";
import { refundRepository } from "../repositories/refund.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { creditWallet, debitWallet } from "./wallet-ops.js";
import { smsbowerClient } from "../integrations/vendor/smsbower/smsbower.client.js";
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

function serializeAdminNumber(number: {
  vendorCost?: { toString(): string } | null;
  expiresAt?: Date | null;
  lastCheckedAt?: Date | null;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>) {
  return {
    ...number,
    vendorCost: number.vendorCost ? toString(number.vendorCost) : null,
    purchasedAt: number.purchasedAt.toISOString(),
    createdAt: number.createdAt.toISOString(),
    updatedAt: number.updatedAt.toISOString(),
    expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
    lastCheckedAt: number.lastCheckedAt ? number.lastCheckedAt.toISOString() : null,
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

    return {
      totalUsers,
      totalOrders,
      pendingTopups,
      pendingRefunds,
      totalDeposits: toString(totalDepositsAgg._sum.amount ?? new Prisma.Decimal(0)),
      totalPurchases: toString(totalPurchasesAgg._sum.amount ?? new Prisma.Decimal(0)),
      availableStock: availableStockAgg._sum.availableStock ?? 0,
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

  async updateUserProfile(
    userId: string,
    input: { fullName?: string; email?: string; whatsappNumber?: string; avatarUrl?: string | null },
    adminId: string
  ) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email !== user.email) {
      const taken = await userRepository.findByEmail(input.email);
      if (taken) {
        throw new AppError("Email is already in use by another user", 409);
      }
    }
    if (input.whatsappNumber && input.whatsappNumber !== user.whatsappNumber) {
      const taken = await userRepository.findByWhatsappNumber(input.whatsappNumber);
      if (taken) {
        throw new AppError("WhatsApp number is already in use by another user", 409);
      }
    }

    const data: Prisma.UserUpdateInput = {};
    if (input.fullName !== undefined) data.fullName = input.fullName;
    if (input.email !== undefined) data.email = input.email;
    if (input.whatsappNumber !== undefined) data.whatsappNumber = input.whatsappNumber;
    if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;

    const updated = await userRepository.update(userId, data);

    await createAuditLog(prisma, {
      adminId,
      action: "USER_PROFILE_UPDATE",
      entityType: "User",
      entityId: userId,
      oldValue: {
        fullName: user.fullName,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
      },
      newValue: {
        fullName: updated.fullName,
        email: updated.email,
        whatsappNumber: updated.whatsappNumber,
      },
    });

    return serializeUser(updated);
  },

  async deleteUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new AppError("You cannot delete your own account", 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    if (user.deletedAt) {
      throw new AppError("User has already been deleted", 409);
    }

    // Soft delete: anonymize the profile and block access, keep financial records.
    const updated = await userRepository.update(userId, {
      fullName: "Deleted User",
      email: `deleted_${userId}@deleted.local`,
      whatsappNumber: `deleted_${userId}`,
      avatarUrl: null,
      status: "BLOCKED",
      deletedAt: new Date(),
    });

    await sessionRepository.deleteManyByUser(userId);

    await createAuditLog(prisma, {
      adminId,
      action: "USER_DELETE",
      entityType: "User",
      entityId: userId,
      newValue: { deletedAt: updated.deletedAt },
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
          marginMultiplier:
            product.marginMultiplier != null
              ? toString(product.marginMultiplier)
              : null,
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

    if (!env.smsbowerApiKey) {
      throw new AppError("SMSBower API key is not configured", 400);
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

    const service = await smsbowerClient.resolveServiceCode(product.service);
    const prices = await smsbowerClient.getPricesV3({
      service,
      country: vendorCountryId,
    });

    const countryData = prices[vendorCountryId];
    const serviceData = countryData?.[service];
    let available = 0;

    if (serviceData) {
      for (const provider of Object.values(serviceData)) {
        if (
          product.vendorProviderId &&
          String(provider.provider_id) !== String(product.vendorProviderId)
        ) {
          continue;
        }
        available += provider.count;
      }
    }

    const notAvailable = available === 0;
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

    return {
      ...updated,
      sellingPrice: toString(updated.sellingPrice),
      vendorCost: toString(updated.vendorCost),
      marginMultiplier:
        updated.marginMultiplier != null
          ? toString(updated.marginMultiplier)
          : null,
      syncedAt: new Date().toISOString(),
      notAvailable,
    };
  },

  async listNumbers(params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      numberRepository.countAll(params),
      numberRepository.listAll(params),
    ]);

    return buildPagination(items.map(serializeAdminNumber), total, { page, limit });
  },

  async getNumber(numberId: string) {
    const number = await numberRepository.findByIdAdmin(numberId);
    if (!number) {
      throw new AppError("Number not found", 404);
    }
    return serializeAdminNumber(number);
  },

  async updateNumber(
    numberId: string,
    input: {
      phoneNumber?: string;
      status?: NumberStatus;
      expiresAt?: string | null;
      vendorOrderId?: string | null;
      vendorOperator?: string | null;
      canGetAnotherSms?: boolean | null;
      otpCount?: number;
    },
    adminId: string
  ) {
    const existing = await numberRepository.findByIdAdmin(numberId);
    if (!existing) {
      throw new AppError("Number not found", 404);
    }

    const data: Prisma.PurchasedNumberUpdateInput = {};
    if (input.phoneNumber !== undefined) data.phoneNumber = input.phoneNumber;
    if (input.status !== undefined) data.status = input.status;
    if (input.expiresAt !== undefined) {
      data.expiresAt = input.expiresAt === null ? null : new Date(input.expiresAt);
    }
    if (input.vendorOrderId !== undefined) data.vendorOrderId = input.vendorOrderId;
    if (input.vendorOperator !== undefined) data.vendorOperator = input.vendorOperator;
    if (input.canGetAnotherSms !== undefined) data.canGetAnotherSms = input.canGetAnotherSms;
    if (input.otpCount !== undefined) data.otpCount = input.otpCount;

    const updated = await numberRepository.update(numberId, data);

    if (input.status === "DISABLED" && existing.status !== "DISABLED") {
      await createNotification(prisma, {
        userId: existing.userId,
        title: "Number disabled",
        message: `Number ${updated.phoneNumber} has been disabled by an administrator.`,
        type: "SYSTEM",
      });
    }

    await createAuditLog(prisma, {
      adminId,
      action: "NUMBER_UPDATE",
      entityType: "PurchasedNumber",
      entityId: numberId,
      oldValue: { status: existing.status, phoneNumber: existing.phoneNumber },
      newValue: { status: updated.status, phoneNumber: updated.phoneNumber },
    });

    return serializeAdminNumber(updated);
  },

  async deleteNumber(numberId: string, adminId: string) {
    const existing = await numberRepository.findByIdAdmin(numberId);
    if (!existing) {
      throw new AppError("Number not found", 404);
    }

    await numberRepository.remove(numberId);

    await createAuditLog(prisma, {
      adminId,
      action: "NUMBER_DELETE",
      entityType: "PurchasedNumber",
      entityId: numberId,
      oldValue: { phoneNumber: existing.phoneNumber, status: existing.status },
    });
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
