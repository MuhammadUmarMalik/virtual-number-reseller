import type { Request, Response } from "express";
import { numberService } from "../services/number.service.js";
import { getOtpByNumber } from "../services/otp-proxy.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const numberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.listNumbers(req.user!.id, {
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
      service: toSingle(req.query.service),
      country: toSingle(req.query.country),
      search: toSingle(req.query.search),
    });
    res.json(successResponse("Numbers retrieved", data));
  }),

  getDetail: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.getDetail(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("Number retrieved", data));
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.getStatus(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("Status retrieved", data));
  }),

  checkOtp: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.checkOtp(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("OTP check completed", data));
  }),

  cancel: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.cancel(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("Number cancelled", data));
  }),

  retry: asyncHandler(async (req: Request, res: Response) => {
    const data = await numberService.retry(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("Retry requested", data));
  }),

  getOtp: asyncHandler(async (req: Request, res: Response) => {
    const data = await getOtpByNumber(req.user!.id, paramString(req.params.numberId));
    res.json(successResponse("OTP retrieved", data));
  }),
};
