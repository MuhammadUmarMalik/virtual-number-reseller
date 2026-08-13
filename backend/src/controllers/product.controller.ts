import type { Request, Response } from "express";
import { productService } from "../services/product.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const productController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.create(req.body);
    res.status(201).json(successResponse("Product created", data));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.update(paramString(req.params.productId), req.body);
    res.json(successResponse("Product updated", data));
  }),

  updatePricing: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.updatePricing(
      paramString(req.params.productId),
      req.body
    );
    res.json(successResponse("Pricing updated", data));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await productService.remove(paramString(req.params.productId));
    res.json(successResponse("Product deleted"));
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.list({
      ...parsePagination(req.query),
      country: toSingle(req.query.country),
      service: toSingle(req.query.service),
      numberType: toSingle(req.query.numberType),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Products retrieved", data));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await productService.getById(paramString(req.params.productId));
    res.json(successResponse("Product retrieved", data));
  }),
};
