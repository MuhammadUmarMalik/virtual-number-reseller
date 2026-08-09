import { Router } from "express";
import { announcementController } from "../controllers/announcement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { announcementSchema } from "../validators/announcement.validator.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

export const announcementRoutes = Router();
announcementRoutes.use(authenticate);
announcementRoutes.get("/", announcementController.listPublished);

export const adminAnnouncementRoutes = Router();
adminAnnouncementRoutes.use(requireAdmin);
adminAnnouncementRoutes.get("/", announcementController.listAll);
adminAnnouncementRoutes.post("/", validate(announcementSchema), announcementController.create);
adminAnnouncementRoutes.patch(
  "/:announcementId",
  validate(announcementSchema.partial()),
  announcementController.update
);
adminAnnouncementRoutes.delete("/:announcementId", announcementController.remove);
