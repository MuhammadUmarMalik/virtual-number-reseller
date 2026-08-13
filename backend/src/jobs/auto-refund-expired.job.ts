import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import { createNotification } from "../services/audit.service.js";
import { creditWallet } from "../services/wallet-ops.js";

const BATCH_SIZE = 100;

export async function runAutoRefundExpired() {
  const now = new Date();

  const expired = await prisma.purchasedNumber.findMany({
    where: {
      status: "EXPIRED",
      otpCount: 0,
      expiresAt: { not: null, lt: now },
      order: {
        status: { notIn: ["REFUNDED", "REFUND_PENDING"] },
      },
    },
    select: {
      id: true,
      userId: true,
      orderId: true,
      order: { select: { orderCode: true, total: true } },
    },
    take: BATCH_SIZE,
  });

  if (expired.length === 0) return;

  const processed = new Set<string>();
  let refunded = 0;

  for (const number of expired) {
    if (processed.has(number.orderId)) continue;
    processed.add(number.orderId);

    try {
      const didRefund = await prisma.$transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: {
            id: number.orderId,
            status: { notIn: ["REFUNDED", "REFUND_PENDING"] },
          },
          data: { status: "REFUNDED" },
        });
        if (claimed.count === 0) return false;

        const alreadyCredited = await tx.walletTransaction.findFirst({
          where: {
            userId: number.userId,
            type: "REFUND",
            referenceType: "REFUND",
            referenceId: number.orderId,
          },
        });
        if (alreadyCredited) return false;

        await creditWallet(tx, {
          userId: number.userId,
          amount: number.order.total,
          type: "REFUND",
          referenceType: "REFUND",
          referenceId: number.orderId,
          description: `Auto-refund for expired order ${number.order.orderCode}`,
          createdBy: "system",
        });

        await tx.purchasedNumber.updateMany({
          where: { orderId: number.orderId, status: "EXPIRED" },
          data: { status: "REFUNDED" },
        });

        await createNotification(tx, {
          userId: number.userId,
          title: "Order auto-refunded",
          message: `Order ${number.order.orderCode} expired without receiving a code and was refunded automatically.`,
          type: "REFUND",
        });

        return true;
      });

      if (didRefund) refunded += 1;
    } catch (error) {
      logger.error(`Auto-refund failed for order ${number.orderId}`, error);
    }
  }

  logger.info(`Auto-refunded ${refunded} expired orders without a code`);
}
