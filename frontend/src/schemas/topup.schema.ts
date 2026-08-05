import { z } from "zod";

export const createTopupSchema = z.object({
  paymentAccountId: z.string().min(1, "Select a payment method"),
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .min(1, "Amount must be at least 1"),
  senderAccount: z
    .string()
    .trim()
    .min(10, "Enter a valid sender account number")
    .max(30, "Sender account is too long"),
  transactionId: z
    .string()
    .trim()
    .max(100, "Transaction ID is too long")
    .optional(),
  notes: z.string().trim().max(500, "Notes are too long").optional(),
});

export type CreateTopupFormValues = z.infer<typeof createTopupSchema>;
