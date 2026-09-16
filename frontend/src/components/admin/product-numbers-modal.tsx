"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiError } from "@/lib/api-client";
import {
  deleteProductNumber,
  getProductNumbers,
  updateProductNumber,
} from "@/services/admin.service";
import type { ProductNumber } from "@/types/order.types";
import { Hash, Pencil, Trash2 } from "lucide-react";

interface ProductNumbersModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

const numberEditSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{6,14}$/, "Use international format, e.g. +12025550123"),
  providerEndpoint: z.string().trim().optional(),
});

type NumberEditValues = z.infer<typeof numberEditSchema>;

interface EditNumberModalProps {
  number: ProductNumber;
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EditNumberModal({
  number,
  productId,
  onClose,
  onSuccess,
}: EditNumberModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NumberEditValues>({
    resolver: zodResolver(numberEditSchema),
    defaultValues: {
      number: number.number,
      providerEndpoint: "",
    },
  });

  const submitForm: SubmitHandler<NumberEditValues> = async (values) => {
    setServerError(null);
    try {
      await updateProductNumber(productId, number.id, {
        number: values.number,
        providerEndpoint: values.providerEndpoint || undefined,
      });
      toast.success("Number updated");
      onSuccess();
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Unable to update number";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <Modal title={`Edit Number · ${number.number}`} onClose={onClose} maxWidth="md">
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
          label="Phone number"
          type="text"
          error={errors.number?.message}
          disabled={isSubmitting}
          {...register("number")}
        />
        <FormField
          label="Provider endpoint"
          type="text"
          error={errors.providerEndpoint?.message}
          disabled={isSubmitting}
          placeholder="https://..."
          {...register("providerEndpoint")}
        />
        <p className="text-xs text-muted-foreground">
          Leave the endpoint blank to keep the current one.
        </p>
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </form>
    </Modal>
  );
}

export function ProductNumbersModal({
  productId,
  productName,
  onClose,
}: ProductNumbersModalProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<ProductNumber | null>(null);

  const query = useQuery({
    queryKey: ["admin", "products", productId, "numbers", page, search, status],
    queryFn: () =>
      getProductNumbers(productId, {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (numberId: string) => deleteProductNumber(productId, numberId),
    onSuccess: () => {
      toast.success("Number deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "products", productId, "numbers"],
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Unable to delete number");
    },
  });

  const handleDelete = (number: ProductNumber) => {
    if (
      window.confirm(
        `Delete ${number.number}? This frees the number back to the product stock.`
      )
    ) {
      deleteMutation.mutate(number.id);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Modal title={`Numbers · ${productName}`} onClose={onClose} maxWidth="2xl">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Label htmlFor="pn-search" className="sr-only">
            Search
          </Label>
          <Input
            id="pn-search"
            placeholder="Search number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Label htmlFor="pn-status" className="sr-only">
            Status
          </Label>
          <Select
            id="pn-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
            <option value="DISABLED">Disabled</option>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch("");
              setStatus("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        </div>

        {query.isLoading ? (
          <LoadingState label="Loading numbers..." variant="table" rows={4} />
        ) : query.isError || !query.data ? (
          <ErrorState message="Unable to load numbers." />
        ) : query.data.items.length === 0 ? (
          <EmptyState
            icon={<Hash className="h-6 w-6" />}
            title="No numbers"
            description="This product has no imported numbers yet."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">OTPs</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((number) => {
                    const canEdit = !number.purchasedNumber;
                    return (
                      <tr
                        key={number.id}
                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {number.number}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={number.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {number.purchasedNumber?.user
                            ? number.purchasedNumber.user.fullName ||
                              number.purchasedNumber.user.email
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {number.purchasedNumber?.otpCount ?? 0}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(number.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {canEdit ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditing(number)}
                                title="Edit number"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(number)}
                                isLoading={
                                  deleteMutation.isPending &&
                                  deleteMutation.variables === number.id
                                }
                                title="Delete number"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <span className="block text-right text-xs text-muted-foreground">
                              Sold
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={query.data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
      {editing && (
        <EditNumberModal
          number={editing}
          productId={productId}
          onClose={() => setEditing(null)}
          onSuccess={() =>
            void queryClient.invalidateQueries({
              queryKey: ["admin", "products", productId, "numbers"],
            })
          }
        />
      )}
    </Modal>
  );
}