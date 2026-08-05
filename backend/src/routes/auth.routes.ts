import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rate-limit.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  refreshTokenSchema,
  signInSchema,
  signUpSchema,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/sign-up", authLimiter, validate(signUpSchema), authController.signUp);
router.post("/sign-in", authLimiter, validate(signInSchema), authController.signIn);
router.post("/refresh", authLimiter, validate(refreshTokenSchema), authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
