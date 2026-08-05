import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import type { AuthResponse, AuthUser } from "../types/common.types.js";

export const authController = {
  signUp: asyncHandler(async (req: Request, res: Response) => {
    const result: AuthResponse = await authService.signUp(req.body);
    res.status(201).json(successResponse("Account created successfully", result));
  }),

  signIn: asyncHandler(async (req: Request, res: Response) => {
    const result: AuthResponse = await authService.signIn(req.body);
    res.json(successResponse("Signed in successfully", result));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const user: AuthUser = await authService.getCurrentUser(req.user!.id);
    res.json(successResponse("Current user retrieved", user));
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result: AuthResponse = await authService.refresh(req.body.refreshToken);
    res.json(successResponse("Tokens refreshed", result));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.body.refreshToken);
    res.json(successResponse("Signed out successfully"));
  }),
};
