import { Router } from "express";
import { smsbowerWebhookController } from "../controllers/smsbower-webhook.controller.js";

export const smsbowerWebhookRoutes = Router();

smsbowerWebhookRoutes.post(
  "/smsbower",
  smsbowerWebhookController.handle
);
