import { prisma } from "../config/database.js";
import { numberRepository } from "../repositories/number.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import { hashMessage } from "../utils/otp-parser.js";
import { realtime } from "../realtime/events.js";
import { resolveVendor } from "../integrations/vendor/vendor.factory.js";
import type { NumberStatus } from "@prisma/client";

const MIN_POLL_INTERVAL_MS = 15_000;

const pollingInFlight = new Set<string>();

function serializeNumber(number: {
  product?: unknown;
  expiresAt?: Date | null;
  lastCheckedAt?: Date | null;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>) {
  return {
    ...number,
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
  vendorActivationId: string | null;
  vendor?: string | null;
  status: string;
  otpCount: number;
  expiresAt?: Date | null;
  lastCheckedAt?: Date | null;
  product?: { vendorId: string | null; service: string | null; vendor?: string | null } | null;
}

async function pollSmsBowerNumber(target: OtpSyncTarget): Promise<number> {
  if (!target.vendorActivationId) return 0;

  const vendor = resolveVendor("SMSBOWER");
  const activation = {
    vendorActivationId: target.vendorActivationId,
    phoneNumber: target.phoneNumber,
    cost: "0",
    countryCode: "",
    canGetAnotherSms: false,
  };

  const status = await vendor.getActivationStatus(activation);

  if (status.status !== "SMS_RECEIVED" || !status.otp) return 0;

  const rawMessage = `SMS from ${target.product?.service ?? "unknown"}: ${status.otp}`;
  const messageHash = hashMessage(target.phoneNumber, rawMessage);
  const existing = await numberRepository.findByMessageHash(messageHash);
  if (existing) return 0;

  try {
    await numberRepository.createOtpMessage({
      userId: target.userId,
      purchasedNumberId: target.id,
      service: target.product?.service ?? null,
      rawMessage,
      otpCode: status.otp,
      messageHash,
    });
    return 1;
  } catch {
    return 0;
  }
}

export async function syncNumberOtps(target: OtpSyncTarget) {
  let savedCount = 0;

  const canPoll =
    !target.expiresAt || target.expiresAt.getTime() > Date.now();

  if (canPoll && !pollingInFlight.has(target.id)) {
    pollingInFlight.add(target.id);
    try {
      savedCount = await pollSmsBowerNumber(target);

      await numberRepository.incrementPollAttempt(target.id);
    } finally {
      pollingInFlight.delete(target.id);
    }
  }

  const newOtpCount = target.otpCount + savedCount;
  const nextStatus: NumberStatus = newOtpCount > 0 ? "RECEIVED" : (target.status as NumberStatus);

  await numberRepository.updateStatus(target.id, {
    status: nextStatus,
    otpCount: newOtpCount,
    lastCheckedAt: new Date(),
  });

  if (savedCount > 0) {
    realtime.emitToUser(target.userId, "otp", { numberId: target.id });
  }

  return { savedCount, newOtpCount, nextStatus };
}

interface WebhookOtpInput {
  vendor: string;
  vendorActivationId: string;
  service: string;
  rawMessage: string;
  otpCode: string;
  receivedAt: Date;
}

export async function processWebhookOtp(input: WebhookOtpInput): Promise<{
  saved: boolean;
  otpCode: string;
}> {
  const number = await prisma.purchasedNumber.findFirst({
    where: {
      vendor: input.vendor as "SMSBOWER",
      vendorActivationId: input.vendorActivationId,
    },
    include: { user: { select: { id: true } } },
  });

  if (!number) {
    return { saved: false, otpCode: input.otpCode };
  }

  const messageHash = hashMessage(number.phoneNumber, input.rawMessage);
  const existing = await numberRepository.findByMessageHash(messageHash);
  if (existing) {
    return { saved: false, otpCode: input.otpCode };
  }

  try {
    await numberRepository.createOtpMessage({
      userId: number.userId,
      purchasedNumberId: number.id,
      service: input.service,
      rawMessage: input.rawMessage,
      otpCode: input.otpCode,
      messageHash,
    });
  } catch {
    return { saved: false, otpCode: input.otpCode };
  }

  const newOtpCount = number.otpCount + 1;
  await numberRepository.updateStatus(number.id, {
    status: "RECEIVED",
    otpCount: newOtpCount,
    lastCheckedAt: new Date(),
  });

  realtime.emitToUser(number.userId, "otp", { numberId: number.id });

  return { saved: true, otpCode: input.otpCode };
}

const TERMINAL_NUMBER_STATUSES = ["EXPIRED", "REFUNDED", "DISABLED"] as const;

function assertNumberActionable(number: {
  status: string;
  expiresAt?: Date | null;
}) {
  if (TERMINAL_NUMBER_STATUSES.includes(number.status as (typeof TERMINAL_NUMBER_STATUSES)[number])) {
    throw new AppError("This number is no longer active", 400);
  }
  if (number.expiresAt && number.expiresAt.getTime() <= Date.now()) {
    throw new AppError("This number has expired", 400);
  }
}

function toVendorActivation(number: {
  phoneNumber: string;
  vendorActivationId?: string | null;
  vendorOrderId?: string | null;
  canGetAnotherSms?: boolean | null;
}) {
  return {
    vendorActivationId: number.vendorActivationId ?? number.vendorOrderId ?? "",
    phoneNumber: number.phoneNumber,
    cost: "0",
    countryCode: "",
    canGetAnotherSms: number.canGetAnotherSms ?? false,
  };
}

export const numberService = {
  async listNumbers(userId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      numberRepository.countByUser(userId, params),
      numberRepository.listByUser(userId, params),
    ]);

    return buildPagination(items.map(serializeNumber), total, { page, limit });
  },

  async requestAnotherSms(userId: string, numberId: string) {
    const purchased = await numberRepository.findByIdForUser(numberId, userId);
    if (!purchased) {
      throw new AppError("Number not found", 404);
    }
    assertNumberActionable(purchased);
    if (!purchased.canGetAnotherSms) {
      throw new AppError(
        "Requesting another SMS is not supported for this activation",
        400
      );
    }

    const vendor = resolveVendor(purchased.vendor);
    const result = await vendor.requestAnotherSms(toVendorActivation(purchased));
    if (!result.success) {
      throw new AppError(result.message || "Unable to request another SMS", 502);
    }

    await numberRepository.updateStatus(purchased.id, {
      status: "WAITING",
      lastCheckedAt: new Date(),
    });
    realtime.emitToUser(userId, "number", {
      numberId: purchased.id,
      status: "WAITING",
    });

    return { message: result.message };
  },

  async completeActivation(userId: string, numberId: string) {
    const purchased = await numberRepository.findByIdForUser(numberId, userId);
    if (!purchased) {
      throw new AppError("Number not found", 404);
    }
    assertNumberActionable(purchased);

    const vendor = resolveVendor(purchased.vendor);
    const result = await vendor.completeActivation(toVendorActivation(purchased));
    if (!result.success) {
      throw new AppError(result.message || "Unable to complete activation", 502);
    }

    await numberRepository.updateStatus(purchased.id, {
      status: "DISABLED",
      lastCheckedAt: new Date(),
    });
    realtime.emitToUser(userId, "number", {
      numberId: purchased.id,
      status: "DISABLED",
    });

    return { message: result.message };
  },

  async checkOtp(userId: string, numberId: string) {
    const purchased = await numberRepository.findByIdForUser(numberId, userId);
    if (!purchased) {
      throw new AppError("Number not found", 404);
    }
    if (["EXPIRED", "REFUNDED", "DISABLED"].includes(purchased.status)) {
      throw new AppError("This number is no longer active", 400);
    }
    if (purchased.expiresAt && purchased.expiresAt.getTime() <= Date.now()) {
      throw new AppError("This number has expired", 400);
    }

    const recentlyPolled =
      purchased.lastCheckedAt &&
      Date.now() - purchased.lastCheckedAt.getTime() < MIN_POLL_INTERVAL_MS;

    let newOtpCount = purchased.otpCount;
    let nextStatus = purchased.status as NumberStatus;
    if (!recentlyPolled) {
      const result = await syncNumberOtps({
        ...purchased,
        vendorActivationId: purchased.vendorActivationId,
        vendor: purchased.vendor,
        vendorOrderId: purchased.vendorOrderId,
      });
      newOtpCount = result.newOtpCount;
      nextStatus = result.nextStatus;
    }

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

  processWebhookOtp,
};
