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

export const updateUserProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").optional(),
  email: z.string().trim().email("Valid email is required").optional(),
  whatsappNumber: z.string().trim().min(5, "WhatsApp number is required").optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("Avatar URL must be valid")
    .optional()
    .or(z.literal("").transform(() => null)),
});

export const updateNumberSchema = z.object({
  phoneNumber: z.string().trim().min(5, "Phone number is required").optional(),
  status: z.enum(["WAITING", "ACTIVE", "RECEIVED", "EXPIRED", "REFUNDED", "DISABLED", "CANCELLED"]).optional(),
  expiresAt: z
    .string()
    .trim()
    .datetime({ message: "Expires at must be a valid ISO datetime" })
    .nullable()
    .optional(),
  vendorOrderId: z.string().trim().nullable().optional(),
  vendorOperator: z.string().trim().nullable().optional(),
  canGetAnotherSms: z.boolean().nullable().optional(),
  otpCount: z.number().int().min(0).optional(),
});

export const updateProductNumberSchema = z
  .object({
    number: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^\+[1-9]\d{6,14}$/.test(v),
        "Use international format, e.g. +12025550123"
      )
      .optional(),
    providerEndpoint: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || /^https:\/\/.+/.test(v),
        "Provider endpoint must be an HTTPS URL"
      )
      .optional(),
  })
  .refine(
    (data) => data.number !== undefined || data.providerEndpoint !== undefined,
    { message: "Provide a phone number or an endpoint to update" }
  );
