import { Router } from "express";
import { topupController } from "../controllers/topup.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTopupSchema } from "../validators/topup.validator.js";

const router = Router();

router.use(authenticate);

router.get("/payment-accounts", topupController.getPaymentAccounts);
router.get("/", topupController.listTopups);
router.post("/", validate(createTopupSchema), topupController.createTopup);
router.get("/:topupId", topupController.getTopup);
router.post("/:topupId/cancel", topupController.cancelTopup);

export default router;
