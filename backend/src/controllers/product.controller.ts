import type { Request, Response } from "express";
import { productService } from "../services/product.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { productRepository } from "../repositories/product.repository.js";
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

  getDistinctValues: asyncHandler(async (_req: Request, res: Response) => {
    const [countries, services, numberTypes] = await Promise.all([
      productRepository.list({ page: 1, limit: 100 }).then((rows) =>
        [...new Set(rows.map((row) => row.country))]
      ),
      productRepository.list({ page: 1, limit: 100 }).then((rows) =>
        [...new Set(rows.map((row) => row.service))]
      ),
      productRepository.list({ page: 1, limit: 100 }).then((rows) =>
        [...new Set(rows.map((row) => row.numberType))]
      ),
    ]);
    res.json(
      successResponse("Product filters retrieved", { countries, services, numberTypes })
    );
  }),
};
