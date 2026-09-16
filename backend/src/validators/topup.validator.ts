import { z } from "zod";

export const createTopupSchema = z.object({
  paymentAccountId: z.string().min(1, "Payment account is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(2).max(3).optional(),
  displayAmount: z.coerce.number().positive().optional(),
  senderAccount: z.string().trim().min(3).optional().or(z.literal("")),
  transactionId: z.string().trim().min(1).optional().or(z.literal("")),
  screenshotUrl: z.string().url("Invalid screenshot URL").optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type CreateTopupInput = z.infer<typeof createTopupSchema>;

export const rejectTopupSchema = z.object({
  reason: z.string().trim().min(2, "Rejection reason is required"),
});

export const topupQuerySchema = z.object({
  status: z.string().optional(),
});
