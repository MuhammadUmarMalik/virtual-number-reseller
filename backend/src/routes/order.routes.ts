import { Router } from "express";
import { orderController } from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrderSchema } from "../validators/order.validator.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { adminOrderController } from "../controllers/admin.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", orderController.list);
router.post("/", validate(createOrderSchema), orderController.create);
router.get("/:orderId/status", orderController.getStatus);
router.get("/:orderId", orderController.getById);

export default router;

export const adminOrderRoutes = Router();
adminOrderRoutes.use(requireAdmin);
adminOrderRoutes.get("/", adminOrderController.listOrders);
adminOrderRoutes.get("/:orderId", adminOrderController.getOrder);
adminOrderRoutes.post("/:orderId/cancel", adminOrderController.cancelOrder);
adminOrderRoutes.post("/:orderId/retry", adminOrderController.retryOrder);
adminOrderRoutes.post("/:orderId/refund", adminOrderController.refundOrder);
