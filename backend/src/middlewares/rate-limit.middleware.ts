import { rateLimit } from "express-rate-limit";
import { errorResponse } from "../utils/api-response.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse("Too many requests, please try again later"));
  },
});
