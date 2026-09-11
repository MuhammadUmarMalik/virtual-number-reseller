"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCurrency } from "@/hooks/use-currency";
import { ApiError } from "@/lib/api-client";
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
  const { formatPrice } = useCurrency();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { productId: product?.id ?? "", quantity: 1 },
  });

  useEffect(() => {
    if (product) {
      reset({ productId: product.id, quantity: 1 });
    }
  }, [product, reset]);

  const quantity = useWatch({ control, name: "quantity" }) || 1;

  if (!product) return null;

  const submitForm: SubmitHandler<CreateOrderFormValues> = async (values) => {
    setServerError(null);
    try {
      const order = await createOrder.mutateAsync({
        productId: product.id,
        quantity: values.quantity,
      });
      reset();
      onClose();
      const number = order.numbers?.[0];
      toast.success(
        number
          ? `Number ${number.phoneNumber} purchased successfully`
          : "Order placed successfully"
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create order. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal title="Buy Number" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        {product.name} — {formatPrice(product.sellingPrice)} each
      </p>
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
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
          {...register("quantity", { valueAsNumber: true })}
        />
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatPrice(Number(product.sellingPrice) * (quantity || 1))}
          </span>
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Confirm Purchase
        </Button>
      </form>
    </Modal>
  );
}
