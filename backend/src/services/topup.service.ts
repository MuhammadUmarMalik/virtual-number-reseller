import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { buildWhatsappLink } from "../integrations/whatsapp/whatsapp-link.js";
import { topupRepository } from "../repositories/topup.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { creditWallet } from "./wallet-ops.js";
import { AppError } from "../utils/app-error.js";
import { generateCode } from "../utils/generate-code.js";
import { buildPagination } from "../utils/pagination.js";
import type { CreateTopupInput } from "../validators/topup.validator.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

export const topupService = {
  async getPaymentAccounts() {
    return topupRepository.findActivePaymentAccounts();
  },

  async createTopup(userId: string, input: CreateTopupInput) {
    const account = await topupRepository.findPaymentAccountById(input.paymentAccountId);
    if (!account || !account.isActive) {
      throw new AppError("Payment account not found", 404);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const transactionId = input.transactionId?.trim() || generateCode("TXN");

    const existingTxn = await topupRepository.findByTransactionId(transactionId);
    if (existingTxn) {
      throw new AppError("This transaction ID has already been submitted", 409);
    }

    let requestCode = generateCode("TOP");
    let attempts = 0;
    while (attempts < 5 && (await topupRepository.findByRequestCode(requestCode))) {
      requestCode = generateCode("TOP");
      attempts += 1;
    }

    const setting = await prisma.appSetting.findUnique({
      where: { key: "admin_whatsapp_number" },
    });
    const adminNumber = setting?.value || "923000000000";

    const senderAccount = input.senderAccount?.trim() || user.whatsappNumber;

    const request = await topupRepository.createRequest({
      requestCode,
      userId,
      paymentAccountId: input.paymentAccountId,
      amount: new Prisma.Decimal(input.amount.toString()),
      senderAccount,
      transactionId,
      screenshotUrl: input.screenshotUrl || null,
      notes: input.notes || null,
    });

    const message = [
      `Top-up request ${requestCode}`,
      `Amount: Rs. ${toString(request.amount)}`,
      `Transaction ID: ${transactionId}`,
      `User: ${user.email}`,
      `Payment method: ${account.paymentMethod} (${account.title})`,
    ].join("\n");

    const whatsappUrl = buildWhatsappLink(adminNumber, message);

    return { ...request, amount: toString(request.amount), whatsappUrl };
  },

  async listTopups(userId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      topupRepository.countByUser(userId, params),
      topupRepository.listByUser(userId, params),
    ]);

    return buildPagination(
      items.map((item) => ({ ...item, amount: toString(item.amount) })),
      total,
      { page, limit }
    );
  },

  async getTopup(userId: string, topupId: string) {
    const request = await topupRepository.findById(topupId);
    if (!request || request.userId !== userId) {
      throw new AppError("Top-up request not found", 404);
    }
    return { ...request, amount: toString(request.amount) };
  },

  async cancelTopup(userId: string, topupId: string) {
    const request = await topupRepository.findById(topupId);
    if (!request || request.userId !== userId) {
      throw new AppError("Top-up request not found", 404);
    }
    if (request.status !== "PENDING") {
      throw new AppError("Only pending requests can be cancelled", 400);
    }

    return topupRepository.updateStatus(topupId, { status: "CANCELLED" });
  },

  async approveTopup(topupId: string, adminId: string) {
    const request = await topupRepository.findById(topupId);
    if (!request) {
      throw new AppError("Top-up request not found", 404);
    }
    if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
      throw new AppError("Only pending requests can be approved", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.topupRequest.update({
        where: { id: topupId },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await creditWallet(tx, {
        userId: request.userId,
        amount: request.amount,
        type: "DEPOSIT",
        referenceType: "TOPUP",
        referenceId: topupId,
        description: `Top-up request ${request.requestCode} approved`,
        createdBy: adminId,
      });

      await createNotification(tx, {
        userId: request.userId,
        title: "Top-up approved",
        message: `Your top-up of Rs. ${toString(request.amount)} has been approved.`,
        type: "TOPUP",
      });

      await createAuditLog(tx, {
        adminId,
        action: "TOPUP_APPROVE",
        entityType: "TopupRequest",
        entityId: topupId,
        newValue: { status: "APPROVED", amount: toString(request.amount) },
      });

      return updated;
    });

    return result;
  },

  async rejectTopup(topupId: string, adminId: string, reason: string) {
    const request = await topupRepository.findById(topupId);
    if (!request) {
      throw new AppError("Top-up request not found", 404);
    }
    if (request.status !== "PENDING" && request.status !== "UNDER_REVIEW") {
      throw new AppError("Only pending requests can be rejected", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.topupRequest.update({
        where: { id: topupId },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: reason,
        },
      });

      await createNotification(tx, {
        userId: request.userId,
        title: "Top-up rejected",
        message: `Your top-up of Rs. ${toString(request.amount)} was rejected. ${reason}`,
        type: "TOPUP",
      });

      await createAuditLog(tx, {
        adminId,
        action: "TOPUP_REJECT",
        entityType: "TopupRequest",
        entityId: topupId,
        newValue: { status: "REJECTED", reason },
      });

      return updated;
    });

    return result;
  },
};
