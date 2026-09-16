import { timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { smsbowerActivationService } from "../services/smsbower-activation.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { errorResponse } from "../utils/api-response.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export const smsbowerWebhookController = {
  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    // The webhook writes OTP codes onto real numbers, so a secret is required
    // in every environment — never fall open in dev/staging.
    const failClosed =
      !env.smsbowerWebhookEnabled || !env.smsbowerWebhookSecret;
    if (failClosed) {
      res.status(404).json(errorResponse("Not found"));
      return;
    }

    const headerSecret = req.get("x-smsbower-secret") ?? req.get("x-webhook-secret");
    if (!headerSecret || !secretsMatch(headerSecret, env.smsbowerWebhookSecret)) {
      res.status(401).json(errorResponse("Unauthorized"));
      return;
    }

    const { activationId, service, text, code, country, receivedAt } = req.body as {
      activationId?: string;
      service?: string;
      text?: string;
      code?: string;
      country?: string;
      receivedAt?: string;
    };

    if (!activationId || !text) {
      res.status(200).json({ success: true, message: "ignored" });
      return;
    }

    try {
      const result = await smsbowerActivationService.processWebhook({
        activationId,
        service,
        text,
        code,
        country,
        receivedAt,
      });
      logger.info(`Webhook processed for activation ${activationId}: ${result.saved ? "saved" : result.reason}`);
    } catch (error) {
      logger.error(`Webhook processing failed for activation ${activationId}`, error);
    }

    res.status(200).json({ success: true, message: "ok" });
  }),
};
