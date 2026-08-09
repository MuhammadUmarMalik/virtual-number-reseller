import { Router } from "express";
import { userController } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/settings.validator.js";

const router = Router();

router.use(authenticate);

router.get("/profile", userController.getProfile);
router.patch("/profile", validate(updateProfileSchema), userController.updateProfile);
router.patch("/password", validate(changePasswordSchema), userController.changePassword);
router.get("/sessions", userController.getSessions);
router.delete("/sessions/:sessionId", userController.removeSession);

export default router;
