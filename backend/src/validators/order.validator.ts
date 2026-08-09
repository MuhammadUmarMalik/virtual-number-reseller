import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderQuerySchema = z.object({
  status: z.string().optional(),
});
