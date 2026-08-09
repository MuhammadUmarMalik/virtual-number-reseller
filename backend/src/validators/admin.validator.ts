import { z } from "zod";

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export const walletAdjustmentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  reason: z.string().trim().min(2, "Reason is required"),
});

export const settingsSchema = z.record(z.string(), z.string());
