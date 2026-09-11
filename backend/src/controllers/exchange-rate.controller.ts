import type { Request, Response } from "express";
import { exchangeRateService } from "../services/exchange-rate.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";

export const exchangeRateController = {
  getRates: asyncHandler(async (_req: Request, res: Response) => {
    const { rates, updatedAt } = await exchangeRateService.getAll();
    res.json(successResponse("Exchange rates retrieved", { rates, updatedAt }));
  }),
};
