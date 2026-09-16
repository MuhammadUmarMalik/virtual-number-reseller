import { Router } from "express";
import { smsbowerWebhookController } from "../controllers/smsbower-webhook.controller.js";
import { webhookLimiter } from "../middlewares/rate-limit.middleware.js";

export const smsbowerWebhookRoutes = Router();
smsbowerWebhookRoutes.post(
  "/smsbower",
  webhookLimiter,
  smsbowerWebhookController.handleWebhook
);
