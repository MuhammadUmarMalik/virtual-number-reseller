import { z } from "zod";

export const paymentAccountSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  accountName: z.string().trim().min(2, "Account name is required"),
  accountNumber: z.string().trim().min(4, "Account number is required"),
  paymentMethod: z.enum(["JAZZCASH", "EASYPAISA", "BANK_TRANSFER"]),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CreatePaymentAccountInput = z.infer<typeof paymentAccountSchema>;
