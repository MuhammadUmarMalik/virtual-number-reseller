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
    if (err.code === "P2003") {
      res
        .status(409)
        .json(errorResponse("Cannot delete: this record is still referenced by other data"));
      return;
    }
    res.status(500).json(errorResponse("Database error"));
    return;
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    // Postgres FK restrict violations (e.g. code 23001) surface here rather
    // than as a known error. Return 409 instead of a bare 500.
    if (/foreign key|restrict|23001/i.test(err.message)) {
      res
        .status(409)
        .json(errorResponse("Cannot delete: this record is still referenced by other data"));
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
