import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../infrastructure/logger";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError("NOT_FOUND", `Route ${req.method} ${req.path} was not found`, 404));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "The request payload is invalid.",
        details: error.flatten(),
        requestId: req.requestId
      }
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: req.requestId
      }
    });
  }

  logger.error({ err: error, requestId: req.requestId }, "Unhandled API error");

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong. Please try again.",
      details: null,
      requestId: req.requestId
    }
  });
}
