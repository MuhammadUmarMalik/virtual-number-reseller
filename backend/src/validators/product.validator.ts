import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z.string().trim().min(2, "Slug is required"),
  country: z.string().trim().min(2, "Country is required"),
  countryCode: z.string().trim().min(2, "Country code is required"),
  service: z.string().trim().min(2, "Service is required"),
  numberType: z.string().trim().min(2, "Number type is required"),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  sellingPrice: z.coerce.number().positive("Selling price must be positive"),
  vendorCost: z.coerce.number().min(0).default(0),
  refundWindowHours: z.coerce.number().int().min(1).default(3),
  availableStock: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).optional(),
});

export type CreateProductInput = z.infer<typeof productSchema>;
