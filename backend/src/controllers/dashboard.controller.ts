import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const dashboardController = {
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const data = await dashboardService.getDashboard(req.user!.id);
    res.json(successResponse("Dashboard retrieved", data));
  }),
};
