import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import userRoutes from "./user.routes.js";
import walletRoutes from "./wallet.routes.js";
import topupRoutes from "./topup.routes.js";
import { productRoutes } from "./product.routes.js";
import { announcementRoutes } from "./announcement.routes.js";
import orderRoutes from "./order.routes.js";
import { numberRoutes, otpRoutes } from "./number.routes.js";
import refundRoutes from "./refund.routes.js";
import notificationRoutes from "./notification.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/wallet", walletRoutes);
router.use("/topups", topupRoutes);
router.use("/products", productRoutes);
router.use("/announcements", announcementRoutes);
router.use("/orders", orderRoutes);
router.use("/numbers", numberRoutes);
router.use("/otp-history", otpRoutes);
router.use("/refunds", refundRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

export default router;
