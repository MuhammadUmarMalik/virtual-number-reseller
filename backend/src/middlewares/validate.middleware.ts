import type { RequestHandler } from "express";
import { ZodError, type ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        next(new AppError("Validation failed", 400, errors));
        return;
      }
      next(error);
    }
  };
}
