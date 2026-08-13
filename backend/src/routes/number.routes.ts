import { Router } from "express";
import { numberController } from "../controllers/number.controller.js";
import { otpController } from "../controllers/otp.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const numberRoutes = Router();
numberRoutes.use(authenticate);
numberRoutes.get("/", numberController.list);
numberRoutes.post("/:numberId/check-otp", numberController.checkOtp);
numberRoutes.post("/:numberId/another-sms", numberController.requestAnotherSms);
numberRoutes.post("/:numberId/complete", numberController.complete);

export const otpRoutes = Router();
otpRoutes.use(authenticate);
otpRoutes.get("/", otpController.list);
otpRoutes.get("/:otpId", otpController.getById);
