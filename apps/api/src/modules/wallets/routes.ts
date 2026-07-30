import { Router, type NextFunction, type Request, type Response } from "express";
import { Prisma } from "@number-reseller/database";
import { requireActiveAccount, requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { sendSuccess } from "../../common/api-response";
import { ApiError } from "../../common/errors";
import { transactionQuerySchema, adminWalletAdjustSchema, reversalSchema } from "./schema";
import { WalletService } from "./service";

export const walletRouter = Router();
const walletService = new WalletService();

const handle =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };

walletRouter.get("/", requireAuth, requireActiveAccount, handle(async (req, res) => {
  const data = await walletService.getBalance(req.auth!.userId);
  return sendSuccess(res, data);
}));

walletRouter.get("/transactions", requireAuth, requireActiveAccount, (req, _res, next) => {
  req.query = transactionQuerySchema.parse(req.query) as unknown as typeof req.query;
  next();
}, handle(async (req, res) => {
  const data = await walletService.getTransactions(req.auth!.userId, req.query as unknown as {
    type?: string; search?: string; from?: string; to?: string; cursor?: string; take?: number;
  });
  return sendSuccess(res, data);
}));

walletRouter.get("/reconciliation", requireAuth, requireRole("ADMIN"), handle(async (req, res) => {
  const userId = req.query.userId as string | undefined;
  const data = userId
    ? await walletService.checkBalance(userId)
    : await walletService.checkBalance(req.auth!.userId);
  return sendSuccess(res, data);
}));

walletRouter.post("/admin/credit", requireAuth, requireRole("ADMIN"), validateBody(adminWalletAdjustSchema), handle(async (req, res) => {
  const { userId, amount, reason, idempotencyKey } = req.body;
  const data = await walletService.adminCredit(
    userId,
    new Prisma.Decimal(amount),
    reason,
    req.auth!.userId,
    idempotencyKey,
    context(req),
  );
  return sendSuccess(res, data);
}));

walletRouter.post("/admin/debit", requireAuth, requireRole("ADMIN"), validateBody(adminWalletAdjustSchema), handle(async (req, res) => {
  const { userId, amount, reason, idempotencyKey } = req.body;
  const data = await walletService.adminDebit(
    userId,
    new Prisma.Decimal(amount),
    reason,
    req.auth!.userId,
    idempotencyKey,
    context(req),
  );
  return sendSuccess(res, data);
}));

walletRouter.post("/admin/reversal", requireAuth, requireRole("ADMIN"), validateBody(reversalSchema), handle(async (req, res) => {
  const { transactionId, reason, idempotencyKey } = req.body;
  const data = await walletService.reversal(
    transactionId,
    reason,
    req.auth!.userId,
    idempotencyKey,
    context(req),
  );
  return sendSuccess(res, data);
}));

function context(req: Request) {
  return {
    requestId: req.requestId,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(req.get("user-agent") ? { userAgent: req.get("user-agent")! } : {}),
  };
}
