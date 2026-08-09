import { Router } from "express";
import { refundController } from "../controllers/refund.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createRefundSchema } from "../validators/refund.validator.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { adminRefundController } from "../controllers/admin.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", refundController.list);
router.post("/", validate(createRefundSchema), refundController.create);
router.get("/:refundId", refundController.getById);

export default router;

export const adminRefundRoutes = Router();
adminRefundRoutes.use(requireAdmin);
adminRefundRoutes.get("/", adminRefundController.listRefunds);
adminRefundRoutes.post("/:refundId/approve", adminRefundController.approveRefund);
adminRefundRoutes.post("/:refundId/reject", adminRefundController.rejectRefund);
