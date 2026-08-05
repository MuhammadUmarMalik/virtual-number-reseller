import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

interface AccessTokenPayload {
  sub: string;
}

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  const token = header.slice(7);
  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.accessTokenSecret, {
      issuer: env.jwtIssuer,
    }) as AccessTokenPayload;
  } catch {
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
