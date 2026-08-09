import type { Request, Response } from "express";
import { adminService } from "../services/admin.service.js";
import { topupService } from "../services/topup.service.js";
import { refundService } from "../services/refund.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.dashboard();
    res.json(successResponse("Dashboard retrieved", data));
  }),

  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listUsers({
      ...parsePagination(req.query),
      search: toSingle(req.query.search),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Users retrieved", data));
  }),

  getUser: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getUser(paramString(req.params.userId));
    res.json(successResponse("User retrieved", data));
  }),

  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateUserStatus(
      paramString(req.params.userId),
      req.body.status,
      req.user!.id
    );
    res.json(successResponse("User status updated", data));
  }),

  updateUserRole: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateUserRole(
      paramString(req.params.userId),
      req.body.role,
      req.user!.id
    );
    res.json(successResponse("User role updated", data));
  }),

  creditUserWallet: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.creditUserWallet(
      paramString(req.params.userId),
      req.body.amount,
      req.body.reason,
      req.user!.id
    );
    res.json(successResponse("Wallet credited", data));
  }),

  debitUserWallet: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.debitUserWallet(
      paramString(req.params.userId),
      req.body.amount,
      req.body.reason,
      req.user!.id
    );
    res.json(successResponse("Wallet debited", data));
  }),

  listTopups: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listTopups({
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Top-up requests retrieved", data));
  }),

  approveTopup: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.approveTopup(paramString(req.params.topupId), req.user!.id);
    res.json(successResponse("Top-up approved", data));
  }),

  rejectTopup: asyncHandler(async (req: Request, res: Response) => {
    const data = await topupService.rejectTopup(
      paramString(req.params.topupId),
      req.user!.id,
      req.body.reason
    );
    res.json(successResponse("Top-up rejected", data));
  }),

  listPaymentAccounts: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listPaymentAccounts(parsePagination(req.query));
    res.json(successResponse("Payment accounts retrieved", data));
  }),

  createPaymentAccount: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createPaymentAccount(req.body);
    res.status(201).json(successResponse("Payment account created", data));
  }),

  updatePaymentAccount: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updatePaymentAccount(paramString(req.params.accountId), req.body);
    res.json(successResponse("Payment account updated", data));
  }),

  deletePaymentAccount: asyncHandler(async (req: Request, res: Response) => {
    await adminService.deletePaymentAccount(paramString(req.params.accountId));
    res.json(successResponse("Payment account deleted"));
  }),

  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listProducts({
      ...parsePagination(req.query),
      search: toSingle(req.query.search),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Products retrieved", data));
  }),

  getSettings: asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.getSettings();
    res.json(successResponse("Settings retrieved", data));
  }),

  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.updateSettings(req.body);
    res.json(successResponse("Settings updated", data));
  }),
};

export const adminOrderController = {
  listOrders: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.listOrders({
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Orders retrieved", data));
  }),

  getOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.getOrder(paramString(req.params.orderId));
    res.json(successResponse("Order retrieved", data));
  }),

  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.cancelOrder(paramString(req.params.orderId), req.user!.id);
    res.json(successResponse("Order cancelled", data));
  }),

  retryOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.retryOrder(paramString(req.params.orderId), req.user!.id);
    res.json(successResponse("Order retry initiated", data));
  }),

  refundOrder: asyncHandler(async (req: Request, res: Response) => {
    const data = await adminService.createAdminRefund(
      paramString(req.params.orderId),
      req.body.reason,
      req.user!.id
    );
    res.status(201).json(successResponse("Refund created", data));
  }),
};

export const adminRefundController = {
  listRefunds: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.listAll({
      ...parsePagination(req.query),
      status: toSingle(req.query.status),
    });
    res.json(successResponse("Refund requests retrieved", data));
  }),

  approveRefund: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.approveRefund(paramString(req.params.refundId), req.user!.id);
    res.json(successResponse("Refund approved", data));
  }),

  rejectRefund: asyncHandler(async (req: Request, res: Response) => {
    const data = await refundService.rejectRefund(
      paramString(req.params.refundId),
      req.user!.id,
      req.body.reason
    );
    res.json(successResponse("Refund rejected", data));
  }),
};
