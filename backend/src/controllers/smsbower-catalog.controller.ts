import type { Request, Response } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { smsbowerCatalogService } from "../services/smsbower-catalog.service.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

function assertSmsBowerConfigured(): void {
  if (!env.smsbowerApiKey) {
    throw new AppError("SMSBower API key is not configured", 400);
  }
}

export const smsbowerCatalogController = {
  getServices: asyncHandler(async (_req: Request, res: Response) => {
    assertSmsBowerConfigured();
    const services = await smsbowerCatalogService.getServices();
    res.json(successResponse("SMSBower services retrieved", { services }));
  }),

  getCountries: asyncHandler(async (_req: Request, res: Response) => {
    assertSmsBowerConfigured();
    const countries = await smsbowerCatalogService.getCountries();
    res.json(successResponse("SMSBower countries retrieved", { countries }));
  }),

  getTopCountries: asyncHandler(async (req: Request, res: Response) => {
    assertSmsBowerConfigured();
    const service = (req.query.service as string | undefined) ?? "";
    if (!service.trim()) {
      throw new AppError("service parameter is required", 400);
    }
    const result = await smsbowerCatalogService.getTopCountriesByService(
      service.trim()
    );
    res.json(successResponse("Top countries retrieved", { topCountries: result }));
  }),

  getStock: asyncHandler(async (req: Request, res: Response) => {
    assertSmsBowerConfigured();
    const service = req.query.service as string | undefined;
    const country = req.query.country as string | undefined;

    const stock = await smsbowerCatalogService.getStock({
      service,
      country,
    });
    res.json(successResponse("SMSBower stock retrieved", { stock }));
  }),

  getBalance: asyncHandler(async (_req: Request, res: Response) => {
    assertSmsBowerConfigured();
    const balance = await smsbowerCatalogService.getBalance();
    res.json(successResponse("SMSBower balance retrieved", balance));
  }),
};
