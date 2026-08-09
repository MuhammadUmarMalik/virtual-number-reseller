import type { Request, Response } from "express";
import { walletService } from "../services/wallet.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";

export const walletController = {
  getWallet: asyncHandler(async (req: Request, res: Response) => {
    const data = await walletService.getWalletSummary(req.user!.id);
    res.json(successResponse("Wallet retrieved", data));
  }),

  listTransactions: asyncHandler(async (req: Request, res: Response) => {
    const data = await walletService.listTransactions(req.user!.id, {
      ...parsePagination(req.query),
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json(successResponse("Transactions retrieved", data));
  }),
};
