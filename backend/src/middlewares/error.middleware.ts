import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { errorResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.errors));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[] | undefined) ?? [];
      res
        .status(409)
        .json(errorResponse("A record with this value already exists", fields));
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json(errorResponse("Record not found"));
      return;
    }
    res.status(500).json(errorResponse("Database error"));
    return;
  }

  if (env.nodeEnv === "production") {
    logger.error(err);
    res.status(500).json(errorResponse("Internal server error"));
    return;
  }

  logger.error(err);
  res.status(500).json(errorResponse((err as Error).message || "Internal server error"));
};
