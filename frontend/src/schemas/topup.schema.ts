import { z } from "zod";

export const createTopupSchema = z.object({
  amount: z
    .number("Amount is required")
    .positive("Amount must be greater than zero")
    .min(1, "Amount must be at least 1"),
});

export type CreateTopupFormValues = z.infer<typeof createTopupSchema>;
