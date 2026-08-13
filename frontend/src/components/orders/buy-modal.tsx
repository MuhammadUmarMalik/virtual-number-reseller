"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { ActivationCard } from "@/components/numbers/activation-card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { useCreateOrder } from "@/hooks/use-orders";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format-currency";
import {
  createOrderSchema,
  type CreateOrderFormValues,
} from "@/schemas/order.schema";
import type { ProductSummary } from "@/types/content.types";
import type { PurchasedNumber } from "@/types/number.types";

interface BuyModalProps {
  product: ProductSummary | null;
  onClose: () => void;
}

export function BuyModal({ product, onClose }: BuyModalProps) {
  const createOrder = useCreateOrder();
  const [serverError, setServerError] = useState<string | null>(null);
  const [purchasedNumber, setPurchasedNumber] =
    useState<PurchasedNumber | null>(null);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrderFormValues>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { productId: product?.id ?? "", quantity: 1 },
  });

  const quantity = useWatch({ control, name: "quantity" }) || 1;
  const maxQuantity = product ? Math.min(product.availableStock, 10) : 1;

  if (!product) return null;

  const showActivation =
    purchasedNumber !== null && purchasedNumber.productId === product.id;

  const handleClose = () => {
    setPurchasedNumber(null);
    onClose();
  };

  const submitForm: SubmitHandler<CreateOrderFormValues> = async (values) => {
    setServerError(null);
    if (values.quantity > product.availableStock) {
      setServerError("Not enough stock for the selected quantity.");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        productId: product.id,
        quantity: values.quantity,
        idempotencyKey: idempotencyKeyRef.current,
      });
      idempotencyKeyRef.current = crypto.randomUUID();
      const number = order.numbers?.[0];
      if (number) {
        setPurchasedNumber(number);
        toast.success(
          `Number ${number.phoneNumber} purchased successfully`
        );
      } else {
        handleClose();
        toast.success("Order placed successfully");
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Unable to create order. Please try again.";
      setServerError(message);
      toast.error(message);
    }
  };

  if (showActivation && purchasedNumber) {
    return (
      <Modal
        title="Number ready"
        onClose={handleClose}
        maxWidth="lg"
        className="sm:max-w-2xl"
      >
        <ActivationCard
          number={purchasedNumber}
          onClosed={handleClose}
        />
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Buy Number" onClose={onClose}>
      <p className="mb-4 text-sm text-muted-foreground">
        {product.name} — {formatCurrency(product.sellingPrice)} each
      </p>
      {/* The ref is only read in the submit event handler, never during render. */}
      {/* eslint-disable-next-line react-hooks/refs */}
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
          max={maxQuantity}
          disabled={isSubmitting}
          error={errors.quantity?.message}
          {...register("quantity", { valueAsNumber: true })}
        />
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(Number(product.sellingPrice) * (quantity || 1))}
          </span>
        </div>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Confirm Purchase
        </Button>
      </form>
    </Modal>
  );
}
