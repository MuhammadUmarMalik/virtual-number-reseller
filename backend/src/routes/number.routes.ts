import { Router } from "express";
import { numberController } from "../controllers/number.controller.js";
import { otpController } from "../controllers/otp.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { otpLimiter } from "../middlewares/rate-limit.middleware.js";

export const numberRoutes = Router();
numberRoutes.use(authenticate);
numberRoutes.get("/", numberController.list);
numberRoutes.get("/:numberId", numberController.getDetail);
numberRoutes.get("/:numberId/status", otpLimiter, numberController.getStatus);
numberRoutes.post("/:numberId/check-otp", otpLimiter, numberController.checkOtp);
numberRoutes.post("/:numberId/cancel", otpLimiter, numberController.cancel);
numberRoutes.post("/:numberId/retry", otpLimiter, numberController.retry);
numberRoutes.get("/:numberId/otp", otpLimiter, numberController.getOtp);
numberRoutes.post("/:numberId/refund", numberController.requestRefund);

export const otpRoutes = Router();
otpRoutes.use(authenticate);
otpRoutes.get("/", otpController.list);
otpRoutes.get("/:otpId", otpController.getById);
