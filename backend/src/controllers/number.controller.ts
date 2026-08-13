import type { Request, Response } from "express";
import { numberService } from "../services/number.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const numberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.listNumbers(req.user!.id, {
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Numbers retrieved", data));
  }),

  checkOtp: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.checkOtp(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("OTP check completed", data));
  }),

  requestAnotherSms: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.requestAnotherSms(
      req.user!.id,
      paramString(req.params.numberId)
    );
    res.json(successResponse("Another SMS requested", data));
  }),

  complete: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.completeActivation(
      req.user!.id,
      paramString(req.params.numberId)
    );
    res.json(successResponse("Activation completed", data));
  }),
};
