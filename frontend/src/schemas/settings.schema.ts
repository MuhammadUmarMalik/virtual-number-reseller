import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .toLowerCase(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid WhatsApp number"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72, "New password must be at most 72 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
