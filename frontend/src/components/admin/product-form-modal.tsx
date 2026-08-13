"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format-currency";
import {
  createProduct,
  getVendorStock,
  syncProductStock,
  updateProduct,
  updateProductPricing,
} from "@/services/admin.service";
import type { Product } from "@/types/order.types";

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, or dashes"),
  country: z.string().trim().min(1, "Country is required"),
  countryCode: z.string().trim().min(1, "Country code is required"),
  service: z.string().trim().min(1, "Service is required"),
  numberType: z.string().trim().min(2, "Number type is required"),
  vendor: z.literal("SMSBOWER"),
  description: z.string().trim().max(500).optional(),
  vendorId: z.string().trim().optional(),
  vendorCountryId: z.string().trim().optional(),
  vendorProviderId: z.string().trim().optional(),
  sellingPrice: z.number().positive("Price must be greater than zero"),
  marginMultiplier: z.number().positive().min(1).max(100).optional(),
  refundWindowHours: z
    .number()
    .min(1, "Refund window must be at least 1 hour"),
  availableStock: z.number().int().min(0),
  serialMode: z.enum(["SINGLE", "MULTIPLE"]),
  secretKey: z.string().trim().optional(),
  vip: z.string().trim().optional(),
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
  const [fetchingStock, setFetchingStock] = useState(false);
  const [vendorCost, setVendorCost] = useState<number | null>(
    product?.vendorCost != null && product.vendorCost !== ""
      ? Number(product.vendorCost)
      : null
  );
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
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
          vendor: (product.vendor as "SMSBOWER") ?? "SMSBOWER",
          vendorId: product.vendorId ?? "",
          vendorCountryId: product.vendorCountryId ?? "",
          vendorProviderId: product.vendorProviderId ?? "",
          sellingPrice: Number(product.sellingPrice),
          marginMultiplier:
            product.marginMultiplier != null && product.marginMultiplier > 0
              ? product.marginMultiplier
              : undefined,
          refundWindowHours: product.refundWindowHours,
          availableStock: product.availableStock,
          serialMode: product.serialMode,
          secretKey: product.secretKey ?? "",
          vip: product.vip ?? "",
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
          vendor: "SMSBOWER",
          vendorId: "",
          vendorCountryId: "",
          vendorProviderId: "",
          sellingPrice: 0,
          marginMultiplier: undefined,
          refundWindowHours: 3,
          availableStock: 0,
          serialMode: "SINGLE",
          secretKey: "",
          vip: "",
          status: "ACTIVE",
        },
  });

  const marginMultiplier = watch("marginMultiplier");

  useEffect(() => {
    if (
      vendorCost != null &&
      vendorCost > 0 &&
      marginMultiplier != null &&
      marginMultiplier > 0
    ) {
      setValue("sellingPrice", Math.round(vendorCost * marginMultiplier * 100) / 100, {
        shouldDirty: true,
      });
    }
  }, [vendorCost, marginMultiplier, setValue]);

  const submitForm: SubmitHandler<ProductFormValues> = async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setServerError(null);
    try {
      if (product) {
        const metadata = {
          name: values.name,
          slug: values.slug,
          country: values.country,
          countryCode: values.countryCode,
          service: values.service,
          numberType: values.numberType,
          vendor: values.vendor,
          description: values.description,
          vendorId: values.vendorId,
          vendorCountryId: values.vendorCountryId,
          vendorProviderId: values.vendorProviderId,
          refundWindowHours: values.refundWindowHours,
          serialMode: values.serialMode,
          secretKey: values.secretKey,
          vip: values.vip,
          status: values.status,
        };
        await updateProduct(product.id, metadata);
        await updateProductPricing(product.id, {
          sellingPrice: values.sellingPrice,
          marginMultiplier: values.marginMultiplier,
        });
        toast.success("Product updated");
      } else {
        await createProduct(values);
        toast.success("Product created");
      }
      onSuccess();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to save product";
      setServerError(message);
      toast.error(message);
    } finally {
      submittingRef.current = false;
    }
  };

  const handleFetchStock = async () => {
    if (product) {
      setServerError(null);
      setFetchingStock(true);
      try {
        const result = await syncProductStock(product.id);
        setValue("availableStock", result.availableStock, { shouldDirty: true });
        if (result.vendorCost != null && Number(result.vendorCost) > 0) {
          setVendorCost(Number(result.vendorCost));
        }
        toast.success(
          result.notAvailable
            ? "Not available — vendor has no stock for this service/country"
            : `Live stock: ${result.availableStock}`
        );
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Unable to sync stock";
        setServerError(message);
        toast.error(message);
      } finally {
        setFetchingStock(false);
      }
      return;
    }

    const vendor = getValues("vendor");
    const country = getValues("countryCode")?.trim();
    const service = getValues("service")?.trim();

    if (!country) {
      toast.error("Enter a country code first");
      return;
    }

    if (!service) {
      toast.error("Enter a service code first (e.g. wa, go)");
      return;
    }

    setServerError(null);
    setFetchingStock(true);
    try {
      const result = await getVendorStock({
        vendor,
        country,
        service,
        vip: getValues("vip")?.trim() || undefined,
      });
      if (result.notAvailable) {
        setValue("availableStock", 0, { shouldDirty: true });
        setVendorCost(null);
        toast.warning("Not available — vendor has no stock for this service/country");
        return;
      }
      const available =
        typeof result.available === "number"
          ? result.available
          : (result.available[country.toLowerCase()] ?? 0);
      setValue("availableStock", available, { shouldDirty: true });
      if (result.vendorCost != null) {
        setVendorCost(Number(result.vendorCost));
      }
      toast.success(`Live stock: ${available}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to fetch stock";
      setServerError(message);
      toast.error(message);
    } finally {
      setFetchingStock(false);
    }
  };

  return (
    <Modal
      title={product ? "Edit Product" : "Add Product"}
      onClose={onClose}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
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
        <div className="space-y-1.5">
          <Label htmlFor="vendor">Vendor</Label>
          <Select id="vendor" disabled={isSubmitting} {...register("vendor")}>
            <option value="SMSBOWER">SMSBower</option>
          </Select>
          {errors.vendor?.message && (
            <p className="text-sm text-red-600">{errors.vendor.message}</p>
          )}
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
          SMSBower uses service codes (e.g. wa, go, tg) and country codes from their catalog.
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            placeholder="e.g. 2"
            {...register("countryCode")}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Service Code"
            type="text"
            error={errors.service?.message}
            disabled={isSubmitting}
            placeholder="e.g. wa, go, tg"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Vendor Country ID"
            type="text"
            error={errors.vendorCountryId?.message}
            disabled={isSubmitting}
            placeholder="e.g. 12"
            {...register("vendorCountryId")}
          />
          <FormField
            label="Provider ID (tier)"
            type="text"
            error={errors.vendorProviderId?.message}
            disabled={isSubmitting}
            placeholder="e.g. 3160"
            {...register("vendorProviderId")}
          />
        </div>
        <FormField
          label="Description"
          type="text"
          error={errors.description?.message}
          disabled={isSubmitting}
          {...register("description")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="availableStock">Stock</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                isLoading={fetchingStock}
                onClick={handleFetchStock}
                title="Fetch live stock from vendor"
              >
                Fetch Live
              </Button>
            </div>
            <FormField
              id="availableStock"
              label=""
              type="number"
              inputMode="numeric"
              error={errors.availableStock?.message}
              disabled={isSubmitting}
              {...register("availableStock", { valueAsNumber: true })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField
            label="Margin (×)"
            type="number"
            inputMode="decimal"
            step="0.05"
            error={errors.marginMultiplier?.message}
            disabled={isSubmitting}
            placeholder="e.g. 1.2"
            {...register("marginMultiplier", {
              valueAsNumber: true,
              setValueAs: (value) =>
                value === "" || value == null ? undefined : Number(value),
            })}
          />
          <div className="space-y-1">
            <Label>Vendor Cost (PKR)</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {vendorCost != null ? formatCurrency(vendorCost) : "—"}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Computed Price</Label>
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
              {vendorCost != null && marginMultiplier != null && marginMultiplier > 0
                ? formatCurrency(Math.round(vendorCost * marginMultiplier * 100) / 100)
                : "Set margin to auto-fill"}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="serialMode">Serial Mode</Label>
            <Select id="serialMode" disabled={isSubmitting} {...register("serialMode")}>
              <option value="SINGLE">Single</option>
              <option value="MULTIPLE">Multiple</option>
            </Select>
            {errors.serialMode?.message && (
              <p className="text-sm text-red-600">{errors.serialMode.message}</p>
            )}
          </div>
          <FormField
            label="Secret Key"
            type="password"
            error={errors.secretKey?.message}
            disabled={isSubmitting}
            placeholder="Only if the project requires it"
            {...register("secretKey")}
          />
          <FormField
            label="VIP Key"
            type="text"
            error={errors.vip?.message}
            disabled={isSubmitting}
            placeholder="Only if using a VIP channel"
            {...register("vip")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" disabled={isSubmitting} {...register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>
        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {product ? "Save Changes" : "Create Product"}
        </Button>
      </form>
    </Modal>
  );
}
