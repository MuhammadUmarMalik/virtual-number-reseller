import { z } from "zod";

export const importProductSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  country: z.string().trim().min(2, "Country is required"),
  countryCode: z
    .string()
    .trim()
    .min(1, "Country code is required")
    .regex(/^\+\d{1,14}$/, "Country code must be a dial code such as +92"),
  service: z.string().trim().min(1, "Service is required"),
  numberType: z.string().trim().min(1, "Product type is required"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  sellingPrice: z.coerce.number().positive("Price must be greater than zero"),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Currency must be a 3-letter code")
    .default("USD"),
  refundWindowHours: z.coerce.number().int().min(1).default(3),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).optional(),
});

export type ImportProductInput = z.infer<typeof importProductSchema>;