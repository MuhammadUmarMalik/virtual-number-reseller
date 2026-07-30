import argon2 from "argon2";
import { createHash, randomUUID } from "node:crypto";
import { prisma, type Prisma, type VerificationTokenType } from "@number-reseller/database";
import { env } from "../../config/env";
import { ApiError } from "../../common/errors";
import { createOpaqueToken, signAccessToken, tokenHashMatches, tokenId } from "./token";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  initialTopupDone: true,
  kycStatus: true,
  createdAt: true,
  wallet: { select: { balance: true, currency: true } }
} satisfies Prisma.UserSelect;

interface RequestContext {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function register(
  input: { name: string; email: string; phone?: string; password: string },
  context: RequestContext,
) {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 1
  });
  const refresh = createOpaqueToken();
  const emailToken = createOpaqueToken();
  const familyId = randomUUID();
  const expiresAt = addDays(env.REFRESH_TOKEN_TTL_DAYS);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          ...(input.phone ? { phone: input.phone } : {}),
          wallet: { create: { balance: 0, currency: "PKR" } }
        },
        select: publicUserSelect
      });
      const session = await tx.refreshToken.create({
        data: {
          id: refresh.id,
          userId: user.id,
          familyId,
          hashedToken: refresh.hash,
          expiresAt,
          ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
          ...(context.userAgent ? { userAgent: context.userAgent } : {})
        }
      });
      await tx.verificationToken.create({
        data: {
          id: emailToken.id,
          userId: user.id,
          type: "EMAIL_VERIFICATION",
          hashedToken: emailToken.hash,
          target: user.email,
          expiresAt: addHours(24)
        }
      });
      await tx.auditLog.create({
        data: auditData(context, user.id, "USER_REGISTERED", "User", user.id)
      });
      return { user, session };
    });
    return sessionResult(result.user, result.session.id, refresh.raw);
  } catch (error) {
    if (isUniqueError(error)) {
      throw new ApiError("ACCOUNT_EXISTS", "An account with those details already exists.", 409);
    }
    throw error;
  }
}

export async function login(input: { email: string; password: string }, context: RequestContext) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true }
  });
  const valid = user
    ? await argon2.verify(user.passwordHash, input.password).catch(() => false)
    : await argon2.verify(DUMMY_HASH, input.password).catch(() => false);

  if (!user || !valid || user.status !== "ACTIVE") {
    await prisma.auditLog.create({
      data: auditData(context, null, "SUSPICIOUS_LOGIN_ATTEMPT", "Authentication", "anonymous", {
        emailFingerprint: fingerprint(input.email),
        reason: user?.status && user.status !== "ACTIVE" ? "ACCOUNT_STATUS" : "INVALID_CREDENTIALS"
      })
    });
    throw new ApiError("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
  }

  const refresh = createOpaqueToken();
  const session = await prisma.refreshToken.create({
    data: {
      id: refresh.id,
      userId: user.id,
      familyId: randomUUID(),
      hashedToken: refresh.hash,
      expiresAt: addDays(env.REFRESH_TOKEN_TTL_DAYS),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {})
    }
  });
  await prisma.auditLog.create({
    data: auditData(context, user.id, "LOGIN_SUCCEEDED", "RefreshToken", session.id)
  });
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return sessionResult(safeUser, session.id, refresh.raw);
}

export async function refreshSession(raw: string | undefined, context: RequestContext) {
  if (!raw) throw invalidSession();
  const id = tokenId(raw);
  if (!id) throw invalidSession();
  const current = await prisma.refreshToken.findUnique({
    where: { id },
    include: { user: { select: publicUserSelect } }
  });
  if (!current || !tokenHashMatches(raw, current.hashedToken)) throw invalidSession();

  if (current.revokedAt) {
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { familyId: current.familyId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      prisma.auditLog.create({
        data: auditData(context, current.userId, "REFRESH_TOKEN_REUSE_DETECTED", "RefreshToken", current.id)
      })
    ]);
    throw invalidSession();
  }
  if (current.expiresAt <= new Date() || current.user.status !== "ACTIVE") throw invalidSession();

  const nextToken = createOpaqueToken();
  const next = await prisma.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({
      where: { id: current.id, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date(), replacedByTokenId: nextToken.id }
    });
    if (revoked.count !== 1) throw invalidSession();
    return tx.refreshToken.create({
      data: {
        id: nextToken.id,
        userId: current.userId,
        familyId: current.familyId,
        hashedToken: nextToken.hash,
        expiresAt: addDays(env.REFRESH_TOKEN_TTL_DAYS),
        ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
        ...(context.userAgent ? { userAgent: context.userAgent } : {})
      }
    });
  });
  return sessionResult(current.user, next.id, nextToken.raw);
}

export async function logout(raw: string | undefined, userId: string | undefined, context: RequestContext) {
  if (raw) {
    const id = tokenId(raw);
    if (id) {
      const token = await prisma.refreshToken.findUnique({ where: { id } });
      if (token && tokenHashMatches(raw, token.hashedToken)) {
        await prisma.refreshToken.updateMany({
          where: { id, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }
    }
  }
  if (userId) {
    await prisma.auditLog.create({
      data: auditData(context, userId, "LOGOUT", "User", userId)
    });
  }
}

export async function forgotPassword(email: string, context: RequestContext) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) return;
  await issueVerificationToken(user.id, "PASSWORD_RESET", user.email, 1);
  await prisma.auditLog.create({
    data: auditData(context, user.id, "PASSWORD_RESET_REQUESTED", "User", user.id)
  });
}

export async function resetPassword(token: string, password: string, context: RequestContext) {
  const record = await consumeToken(token, "PASSWORD_RESET");
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 3,
    parallelism: 1
  });
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.auditLog.create({
      data: auditData(context, record.userId, "PASSWORD_RESET_COMPLETED", "User", record.userId)
    })
  ]);
}

export async function requestEmailVerification(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  await issueVerificationToken(userId, "EMAIL_VERIFICATION", user.email, 24);
}

export async function verifyEmail(token: string) {
  const record = await consumeToken(token, "EMAIL_VERIFICATION");
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() }
  });
}

export async function requestPhoneVerification(userId: string, phone: string) {
  await prisma.user.update({ where: { id: userId }, data: { phone } });
  await issueVerificationToken(userId, "PHONE_VERIFICATION", phone, 0.25);
}

export async function verifyPhone(token: string) {
  const record = await consumeToken(token, "PHONE_VERIFICATION");
  await prisma.user.update({
    where: { id: record.userId },
    data: { phone: record.target, phoneVerifiedAt: new Date() }
  });
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
}

export async function listSessions(userId: string, currentId: string) {
  const sessions = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, lastUsedAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" }
  });
  return sessions.map((session) => ({ ...session, current: session.id === currentId }));
}

export async function revokeSession(userId: string, sessionId: string) {
  const result = await prisma.refreshToken.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  if (!result.count) throw new ApiError("SESSION_NOT_FOUND", "Session was not found.", 404);
}

export async function revokeAllSessions(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

async function issueVerificationToken(userId: string, type: VerificationTokenType, target: string, hours: number) {
  const token = createOpaqueToken();
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { userId, type, consumedAt: null },
      data: { consumedAt: new Date() }
    }),
    prisma.verificationToken.create({
      data: {
        id: token.id,
        userId,
        type,
        hashedToken: token.hash,
        target,
        expiresAt: addHours(hours)
      }
    })
  ]);
  // A mail/SMS adapter consumes this value. It is intentionally never logged or returned by the API.
  return token.raw;
}

async function consumeToken(raw: string, type: VerificationTokenType) {
  const id = tokenId(raw);
  if (!id) throw invalidVerificationToken();
  const record = await prisma.verificationToken.findUnique({ where: { id } });
  if (
    !record ||
    record.type !== type ||
    record.consumedAt ||
    record.expiresAt <= new Date() ||
    !tokenHashMatches(raw, record.hashedToken)
  ) {
    throw invalidVerificationToken();
  }
  const consumed = await prisma.verificationToken.updateMany({
    where: { id, consumedAt: null },
    data: { consumedAt: new Date() }
  });
  if (!consumed.count) throw invalidVerificationToken();
  return record;
}

function sessionResult<T extends { id: string; role: "USER" | "SUPPORT" | "ADMIN" }>(
  user: T,
  sessionId: string,
  refreshToken: string,
) {
  return {
    user,
    sessionId,
    refreshToken,
    accessToken: signAccessToken({ sub: user.id, role: user.role, sessionId })
  };
}

function auditData(
  context: RequestContext,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
): Prisma.AuditLogCreateInput {
  return {
    ...(actorUserId ? { actor: { connect: { id: actorUserId } } } : {}),
    action,
    entityType,
    entityId,
    requestId: context.requestId,
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    ...(metadata ? { metadata } : {})
  };
}

function fingerprint(value: string) {
  return createHash("sha256").update(value.toLowerCase()).digest("base64url").slice(0, 24);
}
function addHours(hours: number) {
  return new Date(Date.now() + hours * 3_600_000);
}
function addDays(days: number) {
  return addHours(days * 24);
}
function invalidSession() {
  return new ApiError("INVALID_SESSION", "Your session is no longer valid. Please sign in again.", 401);
}
function invalidVerificationToken() {
  return new ApiError("INVALID_TOKEN", "This link is invalid or has expired.", 400);
}
function isUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$YnVpbHQtaW4tZHVtbXktc2FsdA$g4D8MfyvkNEqKWDQiBKsUdqQMHg7tbznbJqqmqwSnhI";
