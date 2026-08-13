import type { Request, Response } from "express";
import { numberService } from "../services/number.service.js";
import type { SmsBowerWebhookPayload } from "../integrations/vendor/vendor.types.js";

const WEBHOOK_SOURCE_IP = "167.235.198.205";

export const smsbowerWebhookController = {
  handle(req: Request, res: Response): void {
    const sourceIp = req.ip ?? req.socket.remoteAddress ?? "";
    if (process.env.NODE_ENV === "production" && sourceIp !== WEBHOOK_SOURCE_IP) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }

    const payload = req.body as SmsBowerWebhookPayload;
    if (
      !payload ||
      typeof payload.activationId !== "number" ||
      typeof payload.code !== "string"
    ) {
      res.status(400).json({ success: false, message: "Invalid payload" });
      return;
    }

    res.status(200).json({ status: "ok" });

    void numberService
      .processWebhookOtp({
        vendor: "SMSBOWER",
        vendorActivationId: String(payload.activationId),
        service: payload.service ?? "",
        rawMessage: payload.text ?? "",
        otpCode: payload.code,
        receivedAt: payload.receivedAt
          ? new Date(payload.receivedAt)
          : new Date(),
      })
      .catch(() => undefined);
  },
};
