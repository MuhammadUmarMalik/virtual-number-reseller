import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getCookie } from "../utils/cookie.js";

interface AccessTokenPayload {
  sub: string;
}

function verifyToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, env.accessTokenSecret, {
      issuer: env.jwtIssuer,
    }) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const headerToken = header && header.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = getCookie(req, "access_token");
  const payload = verifyToken(headerToken ?? "") ?? verifyToken(cookieToken ?? "");
  if (!payload) {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new AppError("User not found", 401);
  }
  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is suspended or blocked", 403);
  }

  req.user = user;
  next();
});
