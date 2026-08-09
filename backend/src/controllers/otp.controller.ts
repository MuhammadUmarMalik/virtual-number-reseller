import type { Request, Response } from "express";
import { otpService } from "../services/otp.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const otpController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await otpService.listHistory({
      ...parsePagination(req.query),
      userId: req.user!.id,
      number: toSingle(req.query.number),
      service: toSingle(req.query.service),
      dateFrom: toSingle(req.query.dateFrom),
      dateTo: toSingle(req.query.dateTo),
    });
    res.json(successResponse("OTP history retrieved", data));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await otpService.getOtp(paramString(req.params.otpId), req.user!.id);
    res.json(successResponse("OTP message retrieved", data));
  }),
};
