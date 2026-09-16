import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { refundRepository } from "../repositories/refund.repository.js";
import { orderRepository } from "../repositories/order.repository.js";
import { numberRepository } from "../repositories/number.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { creditWallet } from "./wallet-ops.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { CreateRefundInput } from "../validators/refund.validator.js";

type Tx = Prisma.TransactionClient;

// Total already credited against an order through every refund path — approved
// refund requests plus automatic cancels that returned money because no OTP
// arrived. Its own refund path and the cancel path are independent, so without
// this reconciliation combining them could credit more than the order cost.
async function sumCreditedForOrder(
  client: Tx | typeof prisma,
  orderId: string,
  userId: string
): Promise<Prisma.Decimal> {
  const order = await (client as typeof prisma).order.findUnique({
    where: { id: orderId },
    include: { refunds: { select: { id: true } }, numbers: { select: { id: true } } },
  });
  if (!order) return new Prisma.Decimal(0);

  const transactions = await (client as typeof prisma).walletTransaction.findMany({
    where: {
      userId,
      type: "REFUND",
      OR: [
        { referenceType: "REFUND", referenceId: { in: order.refunds.map((r) => r.id) } },
        { referenceType: "PURCHASED_NUMBER", referenceId: { in: order.numbers.map((n) => n.id) } },
      ],
    },
    select: { amount: true },
  });

  return transactions.reduce(
    (acc, txn) => acc.add(txn.amount),
    new Prisma.Decimal(0)
  );
}

// Remaining creditable amount for an order, capping every refund path at the
// order total so a cancel plus a refund can never stack past what was paid.
async function remainingCreditableForOrder(
  client: Tx | typeof prisma,
  orderId: string,
  userId: string
): Promise<Prisma.Decimal> {
  const order = await (client as typeof prisma).order.findUnique({
    where: { id: orderId },
    select: { total: true },
  });
  if (!order) return new Prisma.Decimal(0);
  const credited = await sumCreditedForOrder(client, orderId, userId);
  return order.total.sub(credited);
}

async function assertRefundWithinRemaining(
  client: Tx | typeof prisma,
  orderId: string,
  userId: string,
  amount: Prisma.Decimal | string
): Promise<void> {
  const remaining = await remainingCreditableForOrder(client, orderId, userId);
  if (new Prisma.Decimal(amount.toString()).gt(remaining)) {
    throw new AppError(
      `The maximum refundable amount for this order is Rs. ${remaining.toString()}`,
      400
    );
  }
}

export { sumCreditedForOrder, remainingCreditableForOrder };

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

    // Same delivery gate the per-number path enforces: once an OTP code was
    // delivered the service was rendered, and once every number is past its
    // refund window there is nothing left to refund.
    const numbers = order.numbers ?? [];
    if (numbers.length === 0) {
      throw new AppError("This order has no numbers to refund", 400);
    }
    const receivedCodes = await prisma.otpMessage.count({
      where: { purchasedNumberId: { in: numbers.map((n) => n.id) }, otpCode: { not: null } },
    });
    if (receivedCodes > 0) {
      throw new AppError(
        "This order already received an OTP and cannot be refunded",
        400
      );
    }
    const now = Date.now();
    if (numbers.every((n) => n.expiresAt && n.expiresAt.getTime() < now)) {
      throw new AppError("The refund window for this order has passed", 400);
    }

    const existing = await refundRepository.findByOrderId(input.orderId, userId);
    if (existing) {
      throw new AppError("A refund request already exists for this order", 409);
    }

    // Reconcile against other credits (cancels, prior approved refunds): the
    // order-level refund covers whatever has not already been returned.
    const remaining = await remainingCreditableForOrder(prisma, order.id, userId);
    if (remaining.lte(0)) {
      throw new AppError("This order has already been fully refunded", 400);
    }
    const amount = order.total.gt(remaining) ? remaining : order.total;

    const refund = await refundRepository.create({
      userId,
      orderId: order.id,
      reason: input.reason,
      amount,
    });

    await createNotification(prisma, {
      userId,
      title: "Refund requested",
      message: `Your refund request for order ${order.orderCode} has been submitted.`,
      type: "REFUND",
    });

    return serializeRefund(refund);
  },

  /**
   * Self-service refund for an imported number that never delivered an OTP.
   * Only imported products qualify, the request is only possible inside the
   * number's refund window, and a refund is refused once any OTP code arrived.
   */
  async createNumberRefund(userId: string, numberId: string) {
    const number = await numberRepository.findByIdForUserWithEndpoint(numberId, userId);
    if (!number) {
      throw new AppError("Number not found", 404);
    }

    if (["REFUNDED", "DISABLED", "CANCELLED"].includes(number.status)) {
      throw new AppError("This number cannot be refunded", 400);
    }
    if (number.expiresAt && number.expiresAt.getTime() < Date.now()) {
      throw new AppError("This number has expired and can no longer be refunded", 400);
    }
    if (number.product?.source !== "IMPORTED") {
      throw new AppError("Only imported numbers can be refunded when no OTP arrives", 400);
    }

    const receivedCodes = await numberRepository.hasOtpCode(number.id);
    if (receivedCodes > 0) {
      throw new AppError("This number already received an OTP and cannot be refunded", 400);
    }

    const existing = await refundRepository.findByOrderId(number.orderId, userId);
    if (existing) {
      throw new AppError(
        `A refund request for this purchase is already ${existing.status.toLowerCase()}`,
        409
      );
    }

    const order = await orderRepository.findById(number.orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }

    // Refund only this number's share of the order, never the full total.
    const amount = order.numbers.length > 0
      ? order.total.div(order.numbers.length).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : order.total;
    await assertRefundWithinRemaining(prisma, order.id, userId, amount);

    const refund = await refundRepository.create({
      userId,
      orderId: order.id,
      reason: `No OTP received for imported number ${number.phoneNumber}`,
      amount,
    });

    await createNotification(prisma, {
      userId,
      title: "Refund requested",
      message: `Your refund request for number ${number.phoneNumber} has been submitted.`,
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

    const result = await prisma.$transaction(async (tx) => {
      // Guard the transition inside the transaction so two concurrent admins
      // cannot both approve the same refund (which would double-credit).
      const claims = await tx.refundRequest.updateMany({
        where: { id: refundId, status: "PENDING" },
        data: {
          status: "COMPLETED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: notes,
        },
      });
      if (claims.count !== 1) {
        throw new AppError("Only pending refunds can be approved", 400);
      }

      // Reconcile the ledger before crediting: a cancel plus this approval must
      // never stack past the order total.
      await assertRefundWithinRemaining(tx, refund.orderId, refund.userId, refund.amount);

      const updated = await tx.refundRequest.findUnique({
        where: { id: refundId },
      });

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

      // Keep item status in sync with the numbers once their money is back.
      await tx.orderItem.updateMany({
        where: { orderId: refund.orderId },
        data: { status: "REFUNDED" },
      });

      // Stop the numbers from being used or re-polled once their money is back.
      await tx.purchasedNumber.updateMany({
        where: { orderId: refund.orderId },
        data: { status: "REFUNDED" },
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

      return updated!;
    });

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
      const claims = await tx.refundRequest.updateMany({
        where: { id: refundId, status: "PENDING" },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          adminNotes: notes,
        },
      });
      if (claims.count !== 1) {
        throw new AppError("Only pending refunds can be rejected", 400);
      }

      const updated = await tx.refundRequest.findUnique({
        where: { id: refundId },
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

      return updated!;
    });

    return result;
  },
};
