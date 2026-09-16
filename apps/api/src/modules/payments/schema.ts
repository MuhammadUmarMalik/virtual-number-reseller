import { z } from "zod";
import { pkrAmountSchema, uuidSchema } from "@number-reseller/validation";

export const createTopUpSchema = z.object({
  provider: z.enum(["JAZZCASH", "EASYPAISA", "MOCK"]),
  amount: pkrAmountSchema,
  idempotencyKey: z.string().min(16).max(128),
});

export const paymentQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateTopUpInput = z.infer<typeof createTopUpSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;
