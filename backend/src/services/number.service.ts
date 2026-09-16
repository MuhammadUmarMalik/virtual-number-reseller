import { env } from "../config/env.js";
import { numberRepository } from "../repositories/number.repository.js";
import { vendorService } from "./vendor.service.js";
import { smsbowerActivationService } from "./smsbower-activation.service.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import { hashMessage } from "../utils/otp-parser.js";
import type { NumberStatus } from "@prisma/client";

function serializeNumber(number: {
  product?: unknown;
  order?: {
    status: string;
    refunds?: Array<{ status: string }>;
  } | null;
  expiresAt?: Date | null;
  lastCheckedAt?: Date | null;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>) {
  const {
    vendorCost: _vendorCost,
    vendorId: _vendorId,
    vendorOrderId: _vendorOrderId,
    vendorActivationId: _vendorActivationId,
    vendorOperator: _vendorOperator,
    currency: _currency,
    vendor: _vendor,
    order: _order,
    ...safe
  } = number;
  return {
    ...safe,
    orderStatus: _order?.status ?? null,
    refundStatus: _order?.refunds?.[0]?.status ?? null,
    purchasedAt: number.purchasedAt.toISOString(),
    createdAt: number.createdAt.toISOString(),
    updatedAt: number.updatedAt.toISOString(),
    expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
    lastCheckedAt: number.lastCheckedAt ? number.lastCheckedAt.toISOString() : null,
  };
}

interface OtpSyncTarget {
  id: string;
  userId: string;
  phoneNumber: string;
  vendorOrderId: string | null;
  status: string;
  otpCount: number;
  product?: { vendorId: string | null; service: string | null } | null;
}

export async function syncNumberOtps(target: OtpSyncTarget) {
  const serial = target.vendorOrderId ? Number(target.vendorOrderId) : NaN;
  const projectId = target.product?.vendorId || env.vendorPid;

  let savedCount = 0;
  if (projectId && Number.isFinite(serial)) {
    const messages = await vendorService.fetchSms({
      projectId,
      phoneNumber: target.phoneNumber,
      serial,
    });

    for (const message of messages) {
      const messageHash = hashMessage(target.phoneNumber, message.rawMessage);
      const existing = await numberRepository.findByMessageHash(messageHash);
      if (existing) continue;

      try {
        await numberRepository.createOtpMessage({
          userId: target.userId,
          purchasedNumberId: target.id,
          service: target.product?.service ?? null,
          rawMessage: message.rawMessage,
          otpCode: message.otpCode,
          messageHash,
        });
        savedCount += 1;
      } catch {
        // unique conflict on messageHash - another request saved it first
      }
    }
  }

  const newOtpCount = target.otpCount + savedCount;
  const nextStatus: NumberStatus = newOtpCount > 0 ? "RECEIVED" : target.status as NumberStatus;

  await numberRepository.updateStatus(target.id, {
    status: nextStatus,
    otpCount: newOtpCount,
    lastCheckedAt: new Date(),
  });

  return { savedCount, newOtpCount, nextStatus };
}

export const numberService = {
  async listNumbers(userId: string, params: {
    page: number; limit: number; status?: string; service?: string; country?: string; search?: string;
  }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      numberRepository.countByUser(userId, params),
      numberRepository.listByUser(userId, params),
    ]);
    return buildPagination(items.map(serializeNumber), total, { page, limit });
  },

  async getDetail(userId: string, numberId: string) {
    return smsbowerActivationService.getUserNumberDetail(numberId, userId);
  },

  async getStatus(userId: string, numberId: string) {
    const purchased = await numberRepository.findByIdForUser(numberId, userId);
    if (!purchased) throw new AppError("Number not found", 404);
    if (purchased.vendorActivationId) {
      return smsbowerActivationService.refreshStatus(numberId, userId);
    }
    return { status: purchased.status, activationStatus: purchased.activationStatus ?? null };
  },

  async cancel(userId: string, numberId: string) {
    return smsbowerActivationService.cancelActivation(numberId, userId);
  },

  async retry(userId: string, numberId: string) {
    return smsbowerActivationService.retryActivation(numberId, userId);
  },

  async checkOtp(userId: string, numberId: string) {
    const purchased = await numberRepository.findByIdForUser(numberId, userId);
    if (!purchased) {
      throw new AppError("Number not found", 404);
    }
    if (["EXPIRED", "REFUNDED", "DISABLED"].includes(purchased.status)) {
      throw new AppError("This number is no longer active", 400);
    }

    if (purchased.vendorActivationId) {
      return smsbowerActivationService.getUserNumberOtp(numberId, userId);
    }

    const { newOtpCount, nextStatus } = await syncNumberOtps(purchased);

    const messages = await numberRepository.findOtpMessages(numberId);

    return {
      message: "OTP check completed",
      otpCount: newOtpCount,
      status: nextStatus,
      newMessages: messages.map((message) => ({
        id: message.id,
        userId: message.userId,
        purchasedNumberId: message.purchasedNumberId,
        vendorMessageId: message.vendorMessageId,
        service: message.service,
        rawMessage: message.rawMessage,
        otpCode: message.otpCode,
        messageHash: message.messageHash,
        receivedAt: message.receivedAt.toISOString(),
        createdAt: message.createdAt.toISOString(),
      })),
    };
  },
};
