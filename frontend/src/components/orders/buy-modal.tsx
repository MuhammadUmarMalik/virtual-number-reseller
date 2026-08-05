"use client";

import { useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useCreateOrder } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format-currency";
import {
  createOrderSchema,
  type CreateOrderFormValues,
} from "@/schemas/order.schema";
import type { ProductSummary } from "@/types/content.types";

interface BuyModalProps {
  product: ProductSummary | null;
  onClose: () => void;
}

export function BuyModal({ product, onClose }: BuyModalProps) {
  const createOrder = useCreateOrder();
  const [serverError, setServerError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { productId: product?.id ?? "", quantity: 1 },
  });

  const quantityInput = register("quantity", { valueAsNumber: true });
  const quantityInputProps = {
    ...quantityInput,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setQuantity(Number(e.target.value));
      void quantityInput.onChange(e);
    },
  };

  if (!product) return null;

  const submitForm: SubmitHandler<CreateOrderFormValues> = async (values) => {
    setServerError(null);
    try {
      await createOrder.mutateAsync({
        productId: product.id,
        quantity: values.quantity,
      });
      reset();
      onClose();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Unable to create order. Please try again."
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
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Buy Number</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {product.name} — {formatCurrency(product.sellingPrice)} each
        </p>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}
          <input type="hidden" {...register("productId")} />
          <FormField
            label="Quantity"
            type="number"
            inputMode="numeric"
            min={1}
            max={product.availableStock}
            disabled={isSubmitting}
            error={errors.quantity?.message}
            {...quantityInputProps}
          />
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-600">Total</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(Number(product.sellingPrice) * (quantity || 1))}
            </span>
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Confirm Purchase
          </Button>
        </form>
      </div>
    </div>
  );
}
