import { z } from "zod";

const productBaseSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  country: z.string().trim().min(1, "Country is required"),
  countryCode: z.string().trim().min(1, "Country code is required"),
  vendorCountryId: z.string().trim().optional().or(z.literal("")),
  countryDialCode: z.string().trim().optional().or(z.literal("")),
  vendorProviderId: z.string().trim().optional().or(z.literal("")),
  service: z.string().trim().min(1, "Service is required"),
  numberType: z.string().trim().min(2, "Number type is required"),
  vendor: z.literal("SMSBOWER").default("SMSBOWER"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  vendorId: z.string().trim().optional().or(z.literal("")),
  sellingPrice: z.coerce.number().positive("Selling price must be positive"),
  vendorCost: z.coerce.number().min(0).default(0),
  marginMultiplier: z.coerce.number().positive().min(1).max(100).optional(),
  refundWindowHours: z.coerce.number().int().min(1).default(3),
  availableStock: z.coerce.number().int().min(0).default(0),
  serialMode: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  secretKey: z.string().trim().optional().or(z.literal("")),
  vip: z.string().trim().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).optional(),
});

export const productSchema = productBaseSchema;

export const createProductSchema = productBaseSchema;

export const updatePricingSchema = z
  .object({
    sellingPrice: z.coerce.number().positive("Selling price must be positive").optional(),
    marginMultiplier: z.coerce.number().positive().min(1).max(100).optional(),
  })
  .refine((data) => data.sellingPrice != null || data.marginMultiplier != null, {
    message: "Provide at least one of sellingPrice or marginMultiplier",
  });

export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
