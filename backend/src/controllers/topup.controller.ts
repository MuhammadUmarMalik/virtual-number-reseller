import type { Request, Response } from "express";
import { topupService } from "../services/topup.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const topupController = {
  getPaymentAccounts: asyncHandler(async (_req: Request, res: Response) => {
    const data = await topupService.getPaymentAccounts();
    res.json(successResponse("Payment accounts retrieved", data));
  }),

  createTopup: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.createTopup(req.user!.id, req.body);
    res.status(201).json(successResponse("Top-up request created", data));
  }),

  listTopups: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.listTopups(req.user!.id, {
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Top-up requests retrieved", data));
  }),

  getTopup: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.getTopup(req.user!.id, paramString(req.params.topupId));
    res.json(successResponse("Top-up request retrieved", data));
  }),

  cancelTopup: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.cancelTopup(req.user!.id, paramString(req.params.topupId));
    res.json(successResponse("Top-up request cancelled", data));
  }),
};
