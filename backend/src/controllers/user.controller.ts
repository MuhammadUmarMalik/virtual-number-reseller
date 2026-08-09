import type { Request, Response } from "express";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { paramString } from "../utils/query.js";

export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getProfile(req.user!.id);
    res.json(successResponse("Profile retrieved", user));
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    res.json(successResponse("Profile updated", user));
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await userService.changePassword(req.user!.id, req.body);
    res.json(successResponse("Password changed"));
  }),

  getSessions: asyncHandler(async (req: Request, res: Response) => {
    const sessions = await userService.getSessions(req.user!.id, req.sessionId);
    res.json(successResponse("Sessions retrieved", sessions));
  }),

  removeSession: asyncHandler(async (req: Request, res: Response) => {
    await userService.removeSession(
      req.user!.id,
      paramString(req.params.sessionId),
      req.sessionId
    );
    res.json(successResponse("Session removed"));
  }),
};
