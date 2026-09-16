import type { Request, Response } from "express";
import { orderService } from "../services/order.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await orderService.createOrder(req.user!.id, req.body);
    res.status(201).json(successResponse("Order created", data));
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await orderService.listOrders(req.user!.id, {
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Orders retrieved", data));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await orderService.getOrder(req.user!.id, paramString(req.params.orderId));
    res.json(successResponse("Order retrieved", data));
  }),

  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await orderService.getOrderStatus(
      req.user!.id,
      paramString(req.params.orderId)
    );
    res.json(successResponse("Order status retrieved", data));
  }),
};
