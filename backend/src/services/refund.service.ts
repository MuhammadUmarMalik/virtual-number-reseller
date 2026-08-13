import { prisma } from "../config/database.js";
import { refundRepository } from "../repositories/refund.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { creditWallet } from "./wallet-ops.js";
import { resolveVendor } from "../integrations/vendor/vendor.factory.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { CreateRefundInput } from "../validators/refund.validator.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

function serializeRefund(refund: {
  amount: { toString(): string };
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>) {
  return {
    ...refund,
    amount: toString(refund.amount),
    reviewedAt: refund.reviewedAt ? refund.reviewedAt.toISOString() : null,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
  };
}

export const refundService = {
  async createRefund(userId: string, input: CreateRefundInput) {
    const order = await orderRepository.findById(input.orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }
    if (order.status !== "COMPLETED") {
      throw new AppError("Only completed orders can be refunded", 400);
    }

    const refundWindowHours =
      order.items?.[0]?.product?.refundWindowHours ?? 3;
    const refundDeadline = order.createdAt.getTime() + refundWindowHours * 60 * 60 * 1000;
    if (Date.now() > refundDeadline) {
      throw new AppError("The refund window for this order has expired", 400);
    }

    const existing = await refundRepository.findByOrderId(input.orderId, userId);
    if (existing) {
      throw new AppError("A refund request already exists for this order", 409);
    }

    const refund = await refundRepository.create({
      userId,
      orderId: order.id,
      reason: input.reason,
      amount: order.total,
    });

    await createNotification(prisma, {
      userId,
      title: "Refund requested",
      message: `Your refund request for order ${order.orderCode} has been submitted.`,
      type: "REFUND",
    });

    return serializeRefund(refund);
  },

  async listRefunds(userId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      refundRepository.countByUser(userId, params),
      refundRepository.listByUser(userId, params),
    ]);

    return buildPagination(items.map(serializeRefund), total, { page, limit });
  },

  async getRefund(userId: string, refundId: string) {
    const refund = await refundRepository.findById(refundId);
    if (!refund || refund.userId !== userId) {
      throw new AppError("Refund request not found", 404);
    }
    return serializeRefund(refund);
  },

  async listAll(params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      refundRepository.countAll(params),
      refundRepository.listAll(params),
    ]);

    return buildPagination(items.map(serializeRefund), total, { page, limit });
  },

  async approveRefund(refundId: string, adminId: string, notes?: string) {
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      throw new AppError("Refund request not found", 404);
    }
    if (refund.status !== "PENDING") {
      throw new AppError("Only pending refunds can be approved", 400);
    }

    let releasedNumbers: Array<{
      vendorActivationId: string | null;
      phoneNumber: string;
    }> = [];

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.refundRequest.updateMany({
        where: { id: refundId, status: "PENDING" },
        data: {
          status: "COMPLETED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: notes,
        },
      });
      if (claimed.count === 0) {
        throw new AppError("Refund request is no longer pending", 400);
      }

      await creditWallet(tx, {
        userId: refund.userId,
        amount: refund.amount,
        type: "REFUND",
        referenceType: "REFUND",
        referenceId: refundId,
        description: `Refund for order ${refund.order.orderCode}`,
        createdBy: adminId,
      });

      await tx.order.update({
        where: { id: refund.orderId },
        data: { status: "REFUNDED" },
      });

      const numbers = await tx.purchasedNumber.updateMany({
        where: {
          orderId: refund.orderId,
          status: { in: ["ACTIVE", "WAITING", "RECEIVED"] },
        },
        data: { status: "REFUNDED" },
      });
      void numbers;

      releasedNumbers = await tx.purchasedNumber.findMany({
        where: {
          orderId: refund.orderId,
          status: "REFUNDED",
          vendor: "SMSBOWER",
          vendorActivationId: { not: null },
        },
        select: {
          phoneNumber: true,
          vendorActivationId: true,
        },
      });

      await createNotification(tx, {
        userId: refund.userId,
        title: "Refund approved",
        message: `Your refund of Rs. ${toString(refund.amount)} has been processed.`,
        type: "REFUND",
      });

      await createAuditLog(tx, {
        adminId,
        action: "REFUND_APPROVE",
        entityType: "RefundRequest",
        entityId: refundId,
        newValue: { status: "COMPLETED", amount: toString(refund.amount) },
      });

      return tx.refundRequest.findUniqueOrThrow({ where: { id: refundId } });
    });

    // Best-effort vendor release after the DB transaction commits.
    const vendor = resolveVendor("SMSBOWER");
    await Promise.allSettled(
      releasedNumbers.map((number) => {
        if (!number.vendorActivationId) return Promise.resolve();
        return vendor
          .cancelActivation({
            vendorActivationId: number.vendorActivationId,
            phoneNumber: number.phoneNumber,
            cost: "0",
            countryCode: "",
            canGetAnotherSms: false,
          })
          .catch(() => undefined);
      })
    );

    return result;
  },

  async rejectRefund(refundId: string, adminId: string, notes: string) {
    const refund = await refundRepository.findById(refundId);
    if (!refund) {
      throw new AppError("Refund request not found", 404);
    }
    if (refund.status !== "PENDING") {
      throw new AppError("Only pending refunds can be rejected", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.refundRequest.update({
        where: { id: refundId },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: notes,
        },
      });

      await createNotification(tx, {
        userId: refund.userId,
        title: "Refund rejected",
        message: `Your refund request was rejected. ${notes}`,
        type: "REFUND",
      });

      await createAuditLog(tx, {
        adminId,
        action: "REFUND_REJECT",
        entityType: "RefundRequest",
        entityId: refundId,
        newValue: { status: "REJECTED", notes },
      });

      return updated;
    });

    return result;
  },
};
