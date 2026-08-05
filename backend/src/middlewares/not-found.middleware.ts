import type { RequestHandler } from "express";
import { errorResponse } from "../utils/api-response.js";

export const notFoundMiddleware: RequestHandler = (req, res) => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.originalUrl}`));
};
