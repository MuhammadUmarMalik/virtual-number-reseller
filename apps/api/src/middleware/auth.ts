import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@number-reseller/database";
import { prisma } from "@number-reseller/database";
import { ApiError } from "../common/errors";
import { ACCESS_COOKIE, readCookie, verifyAccessToken } from "../modules/auth/token";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const encoded = readCookie(req.headers.cookie, ACCESS_COOKIE);
    if (!encoded) throw new Error("Missing token");
    const claims = verifyAccessToken(encoded);
    const [user, session] = await Promise.all([
      prisma.user.findUnique({
        where: { id: claims.sub },
        select: { id: true, role: true, status: true }
      }),
      prisma.refreshToken.findUnique({
        where: { id: claims.sessionId },
        select: { revokedAt: true, expiresAt: true }
      })
    ]);
    if (!user || !session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new Error("Session unavailable");
    }
    req.auth = { userId: user.id, role: user.role, status: user.status, sessionId: claims.sessionId };
    next();
  } catch {
    next(new ApiError("AUTHENTICATION_REQUIRED", "Please sign in to continue.", 401));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError("FORBIDDEN", "You do not have permission to perform this action.", 403));
      return;
    }
    next();
  };
}

export function requireActiveAccount(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth || req.auth.status !== "ACTIVE") {
    next(new ApiError("ACCOUNT_UNAVAILABLE", "This account is not available.", 403));
    return;
  }
  next();
}

export function requireOwner(param = "userId") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || (req.auth.role !== "ADMIN" && req.params[param] !== req.auth.userId)) {
      next(new ApiError("NOT_FOUND", "The requested resource was not found.", 404));
      return;
    }
    next();
  };
}

export async function requirePurchaseOnboarding(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.auth) return next(new ApiError("AUTHENTICATION_REQUIRED", "Please sign in to continue.", 401));
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { emailVerifiedAt: true, phoneVerifiedAt: true, initialTopupDone: true }
    });
    if (!user?.emailVerifiedAt && !user?.phoneVerifiedAt) {
      return next(new ApiError("VERIFICATION_REQUIRED", "Verify your account before purchasing a number.", 403));
    }
    if (!user.initialTopupDone) {
      return next(new ApiError("INITIAL_TOPUP_REQUIRED", "Complete your first top-up of at least PKR 500.", 403));
    }
    next();
  } catch (error) {
    next(error);
  }
}
