import { z } from "zod";

export const emailSchema = z.string().trim().email().max(255).toLowerCase();
export const passwordSchema = z
  .string()
  .min(10, "Password must contain at least 10 characters.")
  .max(128)
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a symbol.");
export const pkrAmountSchema = z.coerce.number().positive().multipleOf(0.01);
export const uuidSchema = z.string().uuid();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Use international format, for example +923001234567.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "Accept the terms and acceptable-use policy." })
  })
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(512),
  password: passwordSchema
});
export const verificationTokenSchema = z.object({ token: z.string().min(32).max(512) });
export const phoneVerificationRequestSchema = z.object({
  phone: z.string().trim().regex(/^\+[1-9]\d{6,14}$/)
});
export const revokeSessionSchema = z.object({ sessionId: uuidSchema });

export const createTopUpSchema = z.object({
  provider: z.enum(["JAZZCASH", "EASYPAISA", "MOCK"]),
  amount: pkrAmountSchema,
  idempotencyKey: z.string().min(16).max(128)
});

export const quoteSchema = z.object({
  serviceId: uuidSchema,
  countryId: uuidSchema,
  quantity: z.coerce.number().int().min(1).max(50)
});

export const createOrderSchema = quoteSchema.extend({
  idempotencyKey: z.string().min(16).max(128)
});

export const adminReasonSchema = z.object({
  reason: z.string().trim().min(10).max(500)
});
