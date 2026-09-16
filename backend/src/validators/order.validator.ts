import { z } from "zod";

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  // Client-side idempotency key so a retried/double-submitted request is a no-op.
  idempotencyKey: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderQuerySchema = z.object({
  status: z.string().optional(),
});
