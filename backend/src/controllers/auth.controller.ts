import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse, errorResponse } from "../utils/api-response.js";
import { getCookie } from "../utils/cookie.js";
import { env } from "../config/env.js";
import type { AuthResponse, AuthUser } from "../types/common.types.js";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isProd = env.nodeEnv === "production";
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
    path: "/",
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: env.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
}

export const authController = {
  signUp: asyncHandler(async (req: Request, res: Response) => {
    const result: AuthResponse = await authService.signUp(req.body);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.status(201).json(successResponse("Account created successfully", result));
  }),

  signIn: asyncHandler(async (req: Request, res: Response) => {
    const result: AuthResponse = await authService.signIn(req.body);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.json(successResponse("Signed in successfully", result));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user: AuthUser = await authService.getCurrentUser(req.user!.id);
    res.json(successResponse("Current user retrieved", user));
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken ?? getCookie(req, REFRESH_TOKEN_COOKIE);
    if (!refreshToken) {
      res.status(401).json(errorResponse("Refresh token is required"));
      return;
    }
    const result: AuthResponse = await authService.refresh(refreshToken);
    setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    res.json(successResponse("Tokens refreshed", result));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken ?? getCookie(req, REFRESH_TOKEN_COOKIE);
    await authService.logout(refreshToken);
    clearAuthCookies(res);
    res.json(successResponse("Signed out successfully"));
  }),
};