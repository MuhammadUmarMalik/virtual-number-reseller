import type { NumberStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { numberRepository } from "../repositories/number.repository.js";
import { assertSafeProviderUrl } from "../utils/ssrf.js";
import { extractOtp, hashMessage } from "../utils/otp-parser.js";
import { AppError } from "../utils/app-error.js";
import { syncNumberOtps } from "./number.service.js";
import { smsbowerActivationService } from "./smsbower-activation.service.js";

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOtpFromProvider(
  endpoint: string,
  phoneNumber: string,
  purchasedNumberId: string,
  userId: string,
  service: string | null
) {
  const safeUrl = await assertSafeProviderUrl(endpoint);

  let response: Response;
  try {
    response = await fetchWithTimeout(safeUrl, env.otpProxyTimeoutMs);
  } catch {
    throw new AppError("Unable to reach the provider right now", 502);
  }
  if (!response.ok) {
    throw new AppError("Provider returned an error while fetching the OTP", 502);
  }

  const rawMessage = await response.text();
  if (!rawMessage.trim()) return null;

  const messageHash = hashMessage(phoneNumber, rawMessage);
  const existing = await numberRepository.findByMessageHash(messageHash);
  if (existing) return null;

  const otpCode = extractOtp(rawMessage);
  try {
    await numberRepository.createOtpMessage({
      userId,
      purchasedNumberId,
      service,
      rawMessage,
      otpCode,
      messageHash,
    });
  } catch {
    return null; // unique hash conflict - a concurrent request saved it first
  }
  return { otpCode, rawMessage };
}

function serializeMessage(message: {
  id: string;
  rawMessage: string;
  otpCode: string | null;
  receivedAt: Date;
}) {
  return {
    id: message.id,
    rawMessage: message.rawMessage,
    otpCode: message.otpCode,
    receivedAt: message.receivedAt.toISOString(),
  };
}

/**
 * Fetches the latest OTP for a user's purchased number. Imported numbers proxy
 * the provider's retrieval endpoint (SSRF-checked); vendor numbers fall back to
 * the SMSBower history poll. Never returns the provider endpoint.
 */
export async function getOtpByNumber(userId: string, numberId: string) {
  const purchased = await numberRepository.findByIdForUserWithEndpoint(numberId, userId);
  if (!purchased) {
    throw new AppError("Number not found", 404);
  }
  if (["EXPIRED", "REFUNDED", "DISABLED"].includes(purchased.status)) {
    throw new AppError("This number is no longer active", 400);
  }

  let otpCount = purchased.otpCount;
  let status: string = purchased.status;

  if (purchased.vendorActivationId) {
    const result = await smsbowerActivationService.getUserNumberOtp(purchased.id, userId);
    return {
      otpCount: result.otpCount,
      status: result.status,
      waiting: result.waiting,
      otp: result.otp,
      message: result.messages[0] ? {
        id: result.messages[0].id,
        rawMessage: result.messages[0].rawMessage,
        otpCode: result.messages[0].otpCode,
        receivedAt: result.messages[0].receivedAt,
      } : null,
    };
  }

  if (purchased.product?.source === "IMPORTED" && purchased.productNumber) {
    const result = await fetchOtpFromProvider(
      purchased.productNumber.providerEndpoint,
      purchased.phoneNumber,
      purchased.id,
      userId,
      purchased.product.service ?? null
    );
    if (result) {
      otpCount += 1;
      status = "RECEIVED";
    }
    await numberRepository.updateStatus(purchased.id, {
      status: otpCount > 0 ? "RECEIVED" : (purchased.status as NumberStatus),
      otpCount,
      lastCheckedAt: new Date(),
    });
  } else {
    const synced = await syncNumberOtps(purchased);
    otpCount = synced.newOtpCount;
    status = synced.nextStatus;
  }

  const latest = await numberRepository.findLatestOtpMessage(purchased.id);

  return {
    otpCount,
    status,
    waiting: !latest,
    otp: latest?.otpCode ?? null,
    message: latest ? serializeMessage(latest) : null,
  };
}