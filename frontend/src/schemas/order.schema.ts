import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(50, "Quantity must be at most 50"),
});

export const createRefundSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
export type CreateRefundFormValues = z.infer<typeof createRefundSchema>;
