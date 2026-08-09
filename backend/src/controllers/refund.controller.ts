import type { Request, Response } from "express";
import { refundService } from "../services/refund.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const refundController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.createRefund(req.user!.id, req.body);
    res.status(201).json(successResponse("Refund requested", data));
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.listRefunds(req.user!.id, {
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Refund requests retrieved", data));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.getRefund(req.user!.id, paramString(req.params.refundId));
    res.json(successResponse("Refund request retrieved", data));
  }),
};
