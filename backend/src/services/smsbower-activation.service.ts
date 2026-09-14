import { Prisma, type NumberStatus } from "@prisma/client";
import { prisma } from "../config/database.js";
import { smsbowerClient } from "../integrations/vendor/smsbower/smsbower.client.js";
import { SMSBOWER_SET_STATUS } from "../integrations/vendor/smsbower/smsbower.types.js";
import { numberRepository } from "../repositories/number.repository.js";
import { AppError } from "../utils/app-error.js";
import { extractOtp, hashMessage } from "../utils/otp-parser.js";
import { createNotification } from "./audit.service.js";

function mapSmsbowerStatusToApp(
  sbStatus: string
): { status: NumberStatus; activationStatus: string } {
  switch (sbStatus) {
    case "STATUS_OK":
      return { status: "RECEIVED", activationStatus: sbStatus };
    case "STATUS_WAIT_CODE":
    case "STATUS_WAIT_RETRY":
    case "STATUS_WAIT_RESEND":
      return { status: "ACTIVE", activationStatus: sbStatus };
    case "STATUS_CANCEL":
      return { status: "CANCELLED", activationStatus: sbStatus };
    default:
      return { status: "ACTIVE", activationStatus: sbStatus };
  }
}

export const smsbowerActivationService = {
  async refreshStatus(numberId: string, userId?: string) {
    const where = userId
      ? { id: numberId, userId }
      : { id: numberId };
    const number = await prisma.purchasedNumber.findFirst({
      where,
      select: {
        id: true,
        otpCount: true,
        vendorActivationId: true,
        status: true,
        activationStatus: true,
        phoneNumber: true,
        userId: true,
        product: { select: { name: true } },
      },
    });
    if (!number) throw new AppError("Number not found", 404);
    if (!number.vendorActivationId) throw new AppError("No activation to refresh", 400);
    if (["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(number.status)) {
      throw new AppError("Number is no longer active", 400);
    }

    const sbStatus = await smsbowerClient.getStatus(number.vendorActivationId);
    const { status, activationStatus } = mapSmsbowerStatusToApp(sbStatus.status);

    const updateData: Prisma.PurchasedNumberUpdateInput = {
      activationStatus: sbStatus.status,
      lastCheckedAt: new Date(),
    };
    let otpCount = number.otpCount;
    if (status !== number.status) {
      updateData.status = status;
    }
    if (sbStatus.status === "STATUS_OK" && sbStatus.code) {
      updateData.activationCompletedAt = new Date();
      if (number.activationStatus !== "STATUS_OK") {
        const rawMessage = `SMS verification code: ${sbStatus.code}`;
        const messageHash = hashMessage(number.phoneNumber, rawMessage);
        const existing = await numberRepository.findByMessageHash(messageHash);
        if (!existing) {
          const otpCode = extractOtp(rawMessage) ?? sbStatus.code;
          await numberRepository.createOtpMessage({
            userId: number.userId,
            purchasedNumberId: number.id,
            service: number.product?.name ?? null,
            rawMessage,
            otpCode,
            messageHash,
          });
          otpCount += 1;
        }
      }
    }
    if (sbStatus.status === "STATUS_CANCEL") {
      updateData.cancelledAt = new Date();
    }
    if (otpCount !== number.otpCount) {
      updateData.otpCount = otpCount;
    }

    await numberRepository.update(numberId, updateData);
    return { status, activationStatus, otpCount, code: sbStatus.code ?? null };
  },

  async cancelActivation(numberId: string, userId?: string) {
    const where = userId
      ? { id: numberId, userId }
      : { id: numberId };
    const number = await prisma.purchasedNumber.findFirst({ where });
    if (!number) throw new AppError("Number not found", 404);
    if (!number.vendorActivationId) throw new AppError("No activation to cancel", 400);
    if (["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(number.status)) {
      throw new AppError("Number is no longer active", 400);
    }

    await smsbowerClient.setStatus(number.vendorActivationId, SMSBOWER_SET_STATUS.CANCEL);
    const now = new Date();
    await numberRepository.update(numberId, {
      status: "CANCELLED",
      activationStatus: "STATUS_CANCEL",
      cancelledAt: now,
      lastCheckedAt: now,
    });

    return { status: "CANCELLED", cancelledAt: now.toISOString() };
  },

  async retryActivation(numberId: string, userId?: string) {
    const where = userId
      ? { id: numberId, userId }
      : { id: numberId };
    const number = await prisma.purchasedNumber.findFirst({ where });
    if (!number) throw new AppError("Number not found", 404);
    if (!number.vendorActivationId) throw new AppError("No activation to retry", 400);
    if (["EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"].includes(number.status)) {
      throw new AppError("Number is no longer active", 400);
    }

    const result = await smsbowerClient.setStatus(
      number.vendorActivationId,
      SMSBOWER_SET_STATUS.REQUEST_ANOTHER_CODE
    );
    const now = new Date();
    await numberRepository.update(numberId, {
      activationStatus: result.code === "RETRY_GET" ? "STATUS_WAIT_RETRY" : number.activationStatus,
      lastCheckedAt: now,
    });
    return { status: number.status, activationStatus: number.activationStatus, retryResult: result.code };
  },

  async processWebhook(payload: {
    activationId: string;
    service?: string;
    text: string;
    code?: string;
    country?: string;
    receivedAt?: string;
  }) {
    const number = await numberRepository.findByActivationId(payload.activationId);
    if (!number) throw new AppError("Activation not found", 404);

    const rawMessage = payload.text;
    const otpCode = payload.code ?? extractOtp(rawMessage);
    const messageHash = hashMessage(number.phoneNumber, rawMessage);
    const existing = await numberRepository.findByMessageHash(messageHash);
    if (existing) return { saved: false, reason: "duplicate" };

    const receivedAt = payload.receivedAt ? new Date(payload.receivedAt) : new Date();
    await numberRepository.createOtpMessage({
      userId: number.userId,
      purchasedNumberId: number.id,
      service: payload.service ?? number.product?.service ?? null,
      rawMessage,
      otpCode,
      messageHash,
      receivedAt,
    });

    await numberRepository.update(number.id, {
      status: "RECEIVED",
      activationStatus: "STATUS_OK",
      activationCompletedAt: receivedAt,
      lastCheckedAt: new Date(),
    });

    await createNotification(prisma, {
      userId: number.userId,
      title: "OTP received",
      message: `OTP received for ${number.phoneNumber}.`,
      type: "OTP",
    });

    return { saved: true };
  },

  async getUserNumberDetail(numberId: string, userId: string) {
    const number = await numberRepository.findByIdForUserDetail(numberId, userId);
    if (!number) throw new AppError("Number not found", 404);
    const {
      vendorCost: _vendorCost,
      vendorId: _vendorId,
      vendorOrderId: _vendorOrderId,
      vendorActivationId: _vendorActivationId,
      vendorOperator: _vendorOperator,
      currency: _currency,
      vendor: _vendor,
      sellingPrice: _sellingPrice,
      ...safe
    } = number;
    return {
      ...safe,
      sellingPrice: number.sellingPrice ? String(number.sellingPrice) : null,
      purchasedAt: number.purchasedAt.toISOString(),
      createdAt: number.createdAt.toISOString(),
      updatedAt: number.updatedAt.toISOString(),
      expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
      lastCheckedAt: number.lastCheckedAt ? number.lastCheckedAt.toISOString() : null,
      activationStartedAt: number.activationStartedAt
        ? number.activationStartedAt.toISOString()
        : null,
      activationCompletedAt: number.activationCompletedAt
        ? number.activationCompletedAt.toISOString()
        : null,
      cancelledAt: number.cancelledAt ? number.cancelledAt.toISOString() : null,
    };
  },

  async getUserNumberOtp(numberId: string, userId: string) {
    const number = await numberRepository.findByIdForUser(numberId, userId);
    if (!number) throw new AppError("Number not found", 404);
    if (["EXPIRED", "REFUNDED", "DISABLED"].includes(number.status)) {
      throw new AppError("Number is no longer active", 400);
    }

    let otpCount = number.otpCount;
    let status = number.status;
    if (number.vendorActivationId) {
      const refreshed = await this.refreshStatus(numberId, userId);
      otpCount = refreshed.otpCount;
      status = refreshed.status;
    }

    const messages = await numberRepository.findOtpMessages(numberId);
    return {
      otpCount,
      status,
      waiting: messages.length === 0,
      otp: messages[0]?.otpCode ?? null,
      messages: messages.map((m) => ({
        id: m.id,
        otpCode: m.otpCode,
        rawMessage: m.rawMessage,
        receivedAt: m.receivedAt.toISOString(),
      })),
    };
  },

  async pollSmsbowerNumbers() {
    const now = new Date();
    const numbers = await numberRepository.listForSmsbowerPolling(now, 50);
    let newOtps = 0;
    for (const number of numbers) {
      try {
        const result = await this.refreshStatus(number.id);
        if (result.code) newOtps += 1;
      } catch {
        // skip individual failures
      }
    }
    return { polled: numbers.length, newOtps };
  },
};