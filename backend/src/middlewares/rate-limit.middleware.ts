import { rateLimit } from "express-rate-limit";
import { errorResponse } from "../utils/api-response.js";

const tooMany = "Too many requests, please try again later";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse(tooMany));
  },
});

// Token refresh needs possession of a refresh-token cookie (an existing
// session), so it is not a password-brute-force surface. Giving it its own
// larger budget keeps a busy refresh client from locking a user out of
// sign-in via the shared auth limit.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse(tooMany));
  },
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse(tooMany));
  },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorResponse(tooMany));
  },
});
