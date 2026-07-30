import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../../config/env";

export const ACCESS_COOKIE = "nr_access";
export const REFRESH_COOKIE = "nr_refresh";

export interface AccessClaims {
  sub: string;
  role: "USER" | "SUPPORT" | "ADMIN";
  sessionId: string;
  type: "access";
}

const secureCookie = env.COOKIE_SECURE ? env.COOKIE_SECURE === "true" : env.NODE_ENV === "production";
const baseCookie = {
  httpOnly: true,
  secure: secureCookie,
  sameSite: "strict" as const,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {})
};

export function createOpaqueToken() {
  const id = randomUUID();
  const secret = randomBytes(48).toString("base64url");
  return { id, raw: `${id}.${secret}`, hash: hashToken(`${id}.${secret}`) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(env.JWT_REFRESH_SECRET).update(token).digest("hex");
}

export function tokenHashMatches(token: string, expected: string) {
  const actual = Buffer.from(hashToken(token), "hex");
  const stored = Buffer.from(expected, "hex");
  return actual.length === stored.length && timingSafeEqual(actual, stored);
}

export function tokenId(token: string) {
  const [id] = token.split(".", 1);
  return id;
}

export function signAccessToken(input: Omit<AccessClaims, "type">) {
  return jwt.sign({ ...input, type: "access" }, env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    issuer: "number-reseller-api",
    audience: "number-reseller-web"
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  const claims = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ["HS256"],
    issuer: "number-reseller-api",
    audience: "number-reseller-web"
  });
  if (
    typeof claims === "string" ||
    claims.type !== "access" ||
    typeof claims.sub !== "string" ||
    typeof claims.sessionId !== "string" ||
    !["USER", "SUPPORT", "ADMIN"].includes(String(claims.role))
  ) {
    throw new Error("Invalid access token");
  }
  return claims as unknown as AccessClaims;
}

export function setSessionCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookie,
    path: "/",
    maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie,
    path: "/api/auth",
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000
  });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, path: "/api/auth" });
}

export function readCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}
