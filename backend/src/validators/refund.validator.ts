import { z } from "zod";

export const createRefundSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  reason: z.string().trim().min(5, "Reason must be at least 5 characters"),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

export const rejectRefundSchema = z.object({
  notes: z.string().trim().min(2, "Notes are required"),
});
