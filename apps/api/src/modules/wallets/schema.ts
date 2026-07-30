import { z } from "zod";
import { pkrAmountSchema, uuidSchema } from "@number-reseller/validation";

export const walletTransactionTypeSchema = z.enum([
  "TOP_UP", "PURCHASE", "REFUND", "ADMIN_CREDIT", "ADMIN_DEBIT", "REVERSAL"
]);

export const transactionQuerySchema = z.object({
  type: walletTransactionTypeSchema.optional(),
  search: z.string().max(200).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminWalletAdjustSchema = z.object({
  userId: uuidSchema,
  amount: pkrAmountSchema,
  reason: z.string().trim().min(10).max(500),
  idempotencyKey: z.string().min(16).max(128),
});

export const reversalSchema = z.object({
  transactionId: uuidSchema,
  reason: z.string().trim().min(10).max(500),
  idempotencyKey: z.string().min(16).max(128),
});

export const reconciliationSchema = z.object({
  userId: uuidSchema.optional(),
});
