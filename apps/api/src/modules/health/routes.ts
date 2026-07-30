import { Router } from "express";
import { sendSuccess } from "../../common/api-response";
import { checkDatabaseHealth, checkRedisHealth } from "../../infrastructure/health";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    service: "number-reseller-api"
  });
});

healthRouter.get("/health/database", async (_req, res, next) => {
  try {
    sendSuccess(res, await checkDatabaseHealth());
  } catch (error) {
    next(error);
  }
});

healthRouter.get("/health/redis", async (_req, res, next) => {
  try {
    sendSuccess(res, await checkRedisHealth());
  } catch (error) {
    next(error);
  }
});
