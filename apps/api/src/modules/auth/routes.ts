import { Router, type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import {
  forgotPasswordSchema,
  loginSchema,
  phoneVerificationRequestSchema,
  registerSchema,
  resetPasswordSchema,
  revokeSessionSchema,
  verificationTokenSchema
} from "@number-reseller/validation";
import { sendSuccess } from "../../common/api-response";
import { requireActiveAccount, requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import {
  forgotPassword,
  getCurrentUser,
  listSessions,
  login,
  logout,
  refreshSession,
  register,
  requestEmailVerification,
  requestPhoneVerification,
  resetPassword,
  revokeAllSessions,
  revokeSession,
  verifyEmail,
  verifyPhone
} from "./service";
import {
  clearSessionCookies,
  readCookie,
  REFRESH_COOKIE,
  setSessionCookies
} from "./token";

export const authRouter = Router();
const handle =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
const strictLimit = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many attempts. Please try again later.",
          details: null,
          requestId: req.requestId
        }
      })
  });

authRouter.post("/register", strictLimit(3, 3_600_000), validateBody(registerSchema), handle(async (req, res) => {
  const result = await register(req.body, context(req));
  setSessionCookies(res, result.accessToken, result.refreshToken);
  return sendSuccess(res, { user: result.user, onboarding: onboarding(result.user) }, 201);
}));

authRouter.post("/login", strictLimit(5, 900_000), validateBody(loginSchema), handle(async (req, res) => {
  const result = await login(req.body, context(req));
  setSessionCookies(res, result.accessToken, result.refreshToken);
  return sendSuccess(res, { user: result.user, onboarding: onboarding(result.user) });
}));

authRouter.post("/refresh", strictLimit(30, 900_000), handle(async (req, res) => {
  const result = await refreshSession(readCookie(req.headers.cookie, REFRESH_COOKIE), context(req));
  setSessionCookies(res, result.accessToken, result.refreshToken);
  return sendSuccess(res, { user: result.user, onboarding: onboarding(result.user) });
}));

authRouter.post("/logout", handle(async (req, res) => {
  const accessUser = await optionalUser(req);
  await logout(readCookie(req.headers.cookie, REFRESH_COOKIE), accessUser, context(req));
  clearSessionCookies(res);
  return sendSuccess(res, { loggedOut: true });
}));

authRouter.get("/me", requireAuth, requireActiveAccount, handle(async (req, res) => {
  const user = await getCurrentUser(req.auth!.userId);
  return sendSuccess(res, { user, onboarding: onboarding(user) });
}));

authRouter.post(
  "/forgot-password",
  strictLimit(3, 3_600_000),
  validateBody(forgotPasswordSchema),
  handle(async (req, res) => {
    await forgotPassword(req.body.email, context(req));
    return sendSuccess(res, {
      message: "If an account exists for that email, a password reset link has been sent."
    });
  }),
);

authRouter.post(
  "/reset-password",
  strictLimit(5, 3_600_000),
  validateBody(resetPasswordSchema),
  handle(async (req, res) => {
    await resetPassword(req.body.token, req.body.password, context(req));
    clearSessionCookies(res);
    return sendSuccess(res, { message: "Your password has been reset. Please sign in again." });
  }),
);

authRouter.post("/verify/email/request", requireAuth, requireActiveAccount, handle(async (req, res) => {
  await requestEmailVerification(req.auth!.userId);
  return sendSuccess(res, { message: "A new email verification link has been queued." });
}));
authRouter.post("/verify/email", validateBody(verificationTokenSchema), handle(async (req, res) => {
  await verifyEmail(req.body.token);
  return sendSuccess(res, { verified: true });
}));
authRouter.post(
  "/verify/phone/request",
  requireAuth,
  requireActiveAccount,
  validateBody(phoneVerificationRequestSchema),
  handle(async (req, res) => {
    await requestPhoneVerification(req.auth!.userId, req.body.phone);
    return sendSuccess(res, { message: "A phone verification code has been queued." });
  }),
);
authRouter.post("/verify/phone", validateBody(verificationTokenSchema), handle(async (req, res) => {
  await verifyPhone(req.body.token);
  return sendSuccess(res, { verified: true });
}));

authRouter.get("/sessions", requireAuth, requireActiveAccount, handle(async (req, res) => {
  return sendSuccess(res, { sessions: await listSessions(req.auth!.userId, req.auth!.sessionId) });
}));
authRouter.delete(
  "/sessions/:sessionId",
  requireAuth,
  requireActiveAccount,
  (req, _res, next) => {
    req.body = { sessionId: req.params.sessionId };
    next();
  },
  validateBody(revokeSessionSchema),
  handle(async (req, res) => {
    await revokeSession(req.auth!.userId, req.body.sessionId);
    if (req.body.sessionId === req.auth!.sessionId) clearSessionCookies(res);
    return sendSuccess(res, { revoked: true });
  }),
);
authRouter.delete("/sessions", requireAuth, requireActiveAccount, handle(async (req, res) => {
  await revokeAllSessions(req.auth!.userId);
  clearSessionCookies(res);
  return sendSuccess(res, { revoked: true });
}));

function context(req: Request) {
  return {
    requestId: req.requestId,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(req.get("user-agent") ? { userAgent: req.get("user-agent")! } : {})
  };
}

async function optionalUser(req: Request) {
  const access = readCookie(req.headers.cookie, "nr_access");
  if (!access) return undefined;
  const { verifyAccessToken } = await import("./token");
  try {
    return verifyAccessToken(access).sub;
  } catch {
    return undefined;
  }
}

function onboarding(user: {
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  initialTopupDone: boolean;
  wallet: { balance: unknown; currency: string } | null;
}) {
  const accountVerified = Boolean(user.emailVerifiedAt || user.phoneVerifiedAt);
  return {
    accountVerified,
    initialTopupDone: user.initialTopupDone,
    canPurchase: accountVerified && user.initialTopupDone,
    minimumFirstTopup: 500,
    wallet: {
      balance: user.wallet?.balance?.toString() ?? "0.00",
      currency: user.wallet?.currency ?? "PKR"
    }
  };
}
