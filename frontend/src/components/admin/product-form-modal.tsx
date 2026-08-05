"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import {
  createProduct,
  updateProduct,
} from "@/services/admin.service";
import type { Product } from "@/types/order.types";

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes"),
  country: z.string().trim().min(2, "Country is required"),
  countryCode: z.string().trim().min(2, "Country code is required"),
  service: z.string().trim().min(2, "Service is required"),
  numberType: z.string().trim().min(2, "Number type is required"),
  description: z.string().trim().max(500).optional(),
  sellingPrice: z.number().positive("Price must be greater than zero"),
  refundWindowHours: z
    .number()
    .min(1, "Refund window must be at least 1 hour"),
  availableStock: z.number().int().min(0),
  status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductFormModal({
  product,
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          country: product.country,
          countryCode: product.countryCode,
          service: product.service,
          numberType: product.numberType,
          description: product.description ?? "",
          sellingPrice: Number(product.sellingPrice),
          refundWindowHours: product.refundWindowHours,
          availableStock: product.availableStock,
          status: product.status,
        }
      : {
          name: "",
          slug: "",
          country: "",
          countryCode: "",
          service: "",
          numberType: "",
          description: "",
          sellingPrice: 0,
          refundWindowHours: 3,
          availableStock: 0,
          status: "ACTIVE",
        },
  });

  const submitForm: SubmitHandler<ProductFormValues> = async (values) => {
    setServerError(null);
    try {
      if (product) {
        await updateProduct(product.id, values);
      } else {
        await createProduct(values);
      }
      onSuccess();
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : "Unable to save product"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}
          <FormField
            label="Name"
            type="text"
            error={errors.name?.message}
            disabled={isSubmitting}
            {...register("name")}
          />
          <FormField
            label="Slug"
            type="text"
            error={errors.slug?.message}
            disabled={isSubmitting}
            {...register("slug")}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Country"
              type="text"
              error={errors.country?.message}
              disabled={isSubmitting}
              {...register("country")}
            />
            <FormField
              label="Country Code"
              type="text"
              error={errors.countryCode?.message}
              disabled={isSubmitting}
              {...register("countryCode")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Service"
              type="text"
              error={errors.service?.message}
              disabled={isSubmitting}
              {...register("service")}
            />
            <FormField
              label="Number Type"
              type="text"
              error={errors.numberType?.message}
              disabled={isSubmitting}
              {...register("numberType")}
            />
          </div>
          <FormField
            label="Description"
            type="text"
            error={errors.description?.message}
            disabled={isSubmitting}
            {...register("description")}
          />
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Price (PKR)"
              type="number"
              inputMode="numeric"
              error={errors.sellingPrice?.message}
              disabled={isSubmitting}
              {...register("sellingPrice", { valueAsNumber: true })}
            />
            <FormField
              label="Refund Window (hrs)"
              type="number"
              inputMode="numeric"
              error={errors.refundWindowHours?.message}
              disabled={isSubmitting}
              {...register("refundWindowHours", { valueAsNumber: true })}
            />
            <FormField
              label="Stock"
              type="number"
              inputMode="numeric"
              error={errors.availableStock?.message}
              disabled={isSubmitting}
              {...register("availableStock", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              disabled={isSubmitting}
              {...register("status")}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {product ? "Save Changes" : "Create Product"}
          </Button>
        </form>
      </div>
    </div>
  );
}
