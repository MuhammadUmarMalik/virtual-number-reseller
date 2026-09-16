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

/**
 * Converts a provider response body into the SMS text and OTP code.
 * Plain text is treated as the message with the code extracted from it.
 * JSON bodies (e.g. the SMS8 record API `{code, msg, data:{code,...}}`) use the
 * structured `data.code` field and never regex-scan dates/ids in the JSON, which
 * otherwise produces wrong codes such as the year from `expired_date`.
 * `data.code` may embed the code inside surrounding text, so a single digit token
 * is extracted instead of joining every digit run (which would concatenate
 * "87190, id 294" into "87190294").
 */
function parseProviderBody(
  body: string
): { sms: string; code: string | null } | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return null; // malformed JSON - keep waiting rather than guess at a code
    }

    const record = (parsed ?? {}) as Record<string, unknown>;
    const data = record.data;
    const dataCode =
      data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>).code
        : undefined;

    let code: string | null = null;
    if (typeof dataCode === "string") {
      code = extractOtp(dataCode);
    } else if (typeof dataCode === "number" && Number.isFinite(dataCode)) {
      const digits = String(dataCode).replace(/\D/g, "");
      if (digits.length >= 4 && digits.length <= 8) code = digits;
    }

    // The provider explicitly reports no verification code yet - stay waiting.
    if (!code) return null;

    const msg = typeof record.msg === "string" && record.msg.trim() ? record.msg : body;
    return { sms: msg, code };
  }

  return { sms: body, code: extractOtp(body) };
}

export async function fetchOtpFromProvider(
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
  const parsed = parseProviderBody(rawMessage);
  if (!parsed) return null;

  const messageHash = hashMessage(phoneNumber, parsed.sms);
  const existing = await numberRepository.findByMessageHash(messageHash);
  if (existing) return null;

  try {
    await numberRepository.createOtpMessage({
      userId,
      purchasedNumberId,
      service,
      rawMessage: parsed.sms,
      otpCode: parsed.code,
      messageHash,
    });
  } catch {
    return null; // unique hash conflict - a concurrent request saved it first
  }
  return { otpCode: parsed.code, rawMessage: parsed.sms };
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

  if (purchased.product?.source === "IMPORTED") {
    // Resolve the provider endpoint from the relation, or from the inventory
    // number directly when the purchased record is missing its link — otherwise
    // an imported number would silently wait forever with no OTP source.
    const productNumber =
      purchased.productNumber ??
      (await numberRepository.findProductNumberByPhoneNumber(purchased.phoneNumber));
    const endpoint = productNumber?.providerEndpoint;

    if (endpoint) {
      const result = await fetchOtpFromProvider(
        endpoint,
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
    }
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