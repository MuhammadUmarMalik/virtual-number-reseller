import express from "express";
import pinoHttp from "pino-http";
import { errorHandler, notFoundHandler } from "./common/errors";
import { logger } from "./infrastructure/logger";
import { requestIdMiddleware } from "./middleware/request-id";
import { applySecurityMiddleware } from "./middleware/security";
import { healthRouter } from "./modules/health/routes";
import { authRouter } from "./modules/auth/routes";
import { walletRouter } from "./modules/wallets/routes";
import { requireActiveAccount, requireAuth, requirePurchaseOnboarding } from "./middleware/auth";

export function createApp() {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(pinoHttp({ logger, genReqId: (req) => req.requestId }));
  applySecurityMiddleware(app);
  app.use(express.json({ limit: "256kb" }));

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/wallet", walletRouter);
  app.post("/api/orders", requireAuth, requireActiveAccount, requirePurchaseOnboarding);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
