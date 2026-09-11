import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { adminController } from "../controllers/admin.controller.js";
import { productController } from "../controllers/product.controller.js";
import { announcementController } from "../controllers/announcement.controller.js";
import { productSchema } from "../validators/product.validator.js";
import { announcementSchema } from "../validators/announcement.validator.js";
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
  updateUserProfileSchema,
  updateNumberSchema,
  walletAdjustmentSchema,
  settingsSchema,
} from "../validators/admin.validator.js";
import { rejectTopupSchema } from "../validators/topup.validator.js";
import { paymentAccountSchema } from "../validators/payment-account.validator.js";
import { adminRefundRoutes } from "./refund.routes.js";
import { adminOrderRoutes } from "./order.routes.js";
import { smsbowerCatalogRoutes } from "./smsbower-catalog.routes.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/dashboard", adminController.dashboard);

router.get("/users", adminController.listUsers);
router.get("/users/:userId", adminController.getUser);
router.patch(
  "/users/:userId/status",
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);
router.patch(
  "/users/:userId/role",
  validate(updateUserRoleSchema),
  adminController.updateUserRole
);
router.patch(
  "/users/:userId",
  validate(updateUserProfileSchema),
  adminController.updateUserProfile
);
router.delete("/users/:userId", adminController.deleteUser);
router.post(
  "/users/:userId/wallet/credit",
  validate(walletAdjustmentSchema),
  adminController.creditUserWallet
);
router.post(
  "/users/:userId/wallet/debit",
  validate(walletAdjustmentSchema),
  adminController.debitUserWallet
);

router.get("/topups", adminController.listTopups);
router.post(
  "/topups/:topupId/approve",
  adminController.approveTopup
);
router.post(
  "/topups/:topupId/reject",
  validate(rejectTopupSchema),
  adminController.rejectTopup
);

router.get("/payment-accounts", adminController.listPaymentAccounts);
router.post(
  "/payment-accounts",
  validate(paymentAccountSchema),
  adminController.createPaymentAccount
);
router.patch(
  "/payment-accounts/:accountId",
  validate(paymentAccountSchema.partial()),
  adminController.updatePaymentAccount
);
router.delete("/payment-accounts/:accountId", adminController.deletePaymentAccount);

router.get("/products", adminController.listProducts);
router.get("/products/vendor-stock", adminController.getVendorStock);
router.post("/products/:productId/sync-stock", adminController.syncProductStock);
router.post("/products", validate(productSchema), productController.create);
router.patch("/products/:productId", validate(productSchema.partial()), productController.update);
router.delete("/products/:productId", productController.remove);
router.use("/smsbower", smsbowerCatalogRoutes);

router.get("/numbers", adminController.listNumbers);
router.get("/numbers/:numberId", adminController.getNumber);
router.patch(
  "/numbers/:numberId",
  validate(updateNumberSchema),
  adminController.updateNumber
);
router.delete("/numbers/:numberId", adminController.deleteNumber);

router.use("/orders", adminOrderRoutes);
router.use("/refunds", adminRefundRoutes);

router.get("/announcements", announcementController.listAll);
router.post("/announcements", validate(announcementSchema), announcementController.create);
router.patch(
  "/announcements/:announcementId",
  validate(announcementSchema.partial()),
  announcementController.update
);
router.delete("/announcements/:announcementId", announcementController.remove);

router.get("/settings", adminController.getSettings);
router.patch("/settings", validate(settingsSchema), adminController.updateSettings);

export default router;
