import { Router, type NextFunction, type Request, type Response } from "express";
import { requireActiveAccount, requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { sendSuccess } from "../../common/api-response";
import { ApiError } from "../../common/errors";
import { PaymentService } from "./service";
import { createTopUpSchema, paymentQuerySchema } from "./schema";

export const paymentRouter = Router();
const paymentService = new PaymentService();

const handle =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };

function context(req: Request) {
  return {
    requestId: req.requestId,
    ...(req.ip ? { ipAddress: req.ip } : {}),
    ...(req.get("user-agent") ? { userAgent: req.get("user-agent")! } : {}),
  };
}

paymentRouter.post(
  "/top-up",
  requireAuth,
  requireActiveAccount,
  validateBody(createTopUpSchema),
  handle(async (req, res) => {
    const { provider, amount, idempotencyKey } = req.body;
    const result = await paymentService.createTopUp(
      req.auth!.userId,
      amount,
      provider,
      idempotencyKey,
      context(req),
    );
    return sendSuccess(res, result, 201);
  }),
);

paymentRouter.get(
  "/:id",
  requireAuth,
  requireActiveAccount,
  handle(async (req, res) => {
    const paymentId = req.params.id as string;
    if (!paymentId) throw new ApiError("VALIDATION_ERROR", "Payment ID is required.", 400);
    const result = await paymentService.getPayment(paymentId, req.auth!.userId);
    return sendSuccess(res, result);
  }),
);

paymentRouter.get(
  "/",
  requireAuth,
  requireActiveAccount,
  (req, _res, next) => {
    req.query = paymentQuerySchema.parse(req.query) as unknown as typeof req.query;
    next();
  },
  handle(async (req, res) => {
    const { cursor, take } = req.query as unknown as { cursor?: string; take?: number };
    const result = await paymentService.listPayments(req.auth!.userId, cursor, take);
    return sendSuccess(res, result);
  }),
);

paymentRouter.post(
  "/jazzcash/callback",
  handle(async (req, res) => {
    const result = await paymentService.processCallback(
      "JAZZCASH",
      req.body as Record<string, unknown>,
      req.headers as Record<string, string | string[] | undefined>,
      { requestId: req.requestId },
    );
    return sendSuccess(res, result);
  }),
);

paymentRouter.post(
  "/easypaisa/callback",
  handle(async (req, res) => {
    const result = await paymentService.processCallback(
      "EASYPAISA",
      req.body as Record<string, unknown>,
      req.headers as Record<string, string | string[] | undefined>,
      { requestId: req.requestId },
    );
    return sendSuccess(res, result);
  }),
);

paymentRouter.post(
  "/mock/callback",
  handle(async (req, res) => {
    const result = await paymentService.processCallback(
      "MOCK",
      req.body as Record<string, unknown>,
      req.headers as Record<string, string | string[] | undefined>,
      { requestId: req.requestId },
    );
    return sendSuccess(res, result);
  }),
);
