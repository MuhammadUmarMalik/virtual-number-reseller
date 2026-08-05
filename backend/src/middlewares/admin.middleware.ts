import type { RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new AppError("Authentication required", 401));
    return;
  }
  if (req.user.role !== "ADMIN") {
    next(new AppError("Admin access required", 403));
    return;
  }
  next();
};
