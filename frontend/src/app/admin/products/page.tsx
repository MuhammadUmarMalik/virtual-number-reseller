"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Power, RefreshCw, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import { SmsBowerCatalogModal } from "@/components/admin/smsbower-catalog-modal";
import { useCurrency } from "@/hooks/use-currency";
import { ApiError } from "@/lib/api-client";
import {
  deleteProduct,
  getAdminProducts,
  syncProductStock,
  updateProduct,
} from "@/services/admin.service";
import type { Product } from "@/types/order.types";

function formatSyncedAt(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showSmsBowerCatalog, setShowSmsBowerCatalog] = useState(false);

  const { formatPrice } = useCurrency();

  const query = useQuery({
    queryKey: ["admin", "products", page],
    queryFn: () => getAdminProducts({ page, limit: 20 }),
    refetchInterval: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: (product: Product) =>
      updateProduct(product.id, {
        status: product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    onSuccess: (_data, product) => {
      const enabled = product.status === "ACTIVE";
      toast.success(enabled ? "Product disabled" : "Product enabled");
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to update product"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      toast.success("Product deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to delete product"
      );
    },
  });

  const syncMutation = useMutation({
    mutationFn: (productId: string) => syncProductStock(productId),
    onSuccess: (result) => {
      toast.success(
        result.notAvailable
          ? "Vendor has no stock for this service/country (Not available)"
          : `Live stock: ${result.availableStock}`
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Unable to sync stock"
      );
    },
  });

  const handleDelete = (product: Product) => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(product.id);
    }
  };

  if (query.isLoading) {
    return <LoadingState label="Loading products..." variant="table" rows={5} />;
  }

  if (query.isError || !query.data) {
    return <ErrorState message="Unable to load products." />;
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage the numbers you sell"
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSmsBowerCatalog(true)}
            >
              <Globe className="mr-2 h-4 w-4" />
              Browse SMSBower
            </Button>
            <Button type="button" onClick={() => setShowCreate(true)}>
              Add Product
            </Button>
          </div>
        }
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No products yet"
          icon={<Package className="h-6 w-6" />}
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSmsBowerCatalog(true)}
              >
                Browse SMSBower
              </Button>
              <Button onClick={() => setShowCreate(true)}>Add Product</Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Last Synced</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {product.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        SMSBower
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.country}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.service}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.vendorProviderId ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {product.vendorProviderId}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.numberType}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatPrice(product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.availableStock}
                      {product.availableStock === 0 &&
                        product.lastSyncedAt != null && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            Not available
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatSyncedAt(product.lastSyncedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate(product.id)}
                          isLoading={
                            syncMutation.isPending &&
                            syncMutation.variables === product.id
                          }
                          title="Fetch live stock from vendor"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden lg:inline">
                            Fetch Live
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMutation.mutate(product)}
                          isLoading={
                            toggleMutation.isPending &&
                            toggleMutation.variables?.id === product.id
                          }
                          title={
                            product.status === "ACTIVE"
                              ? "Disable product"
                              : "Enable product"
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            {product.status === "ACTIVE" ? "Disable" : "Enable"}
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product)}
                          isLoading={
                            deleteMutation.isPending &&
                            deleteMutation.variables === product.id
                          }
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {(showCreate || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowCreate(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            setShowCreate(false);
            setEditingProduct(null);
            void query.refetch();
          }}
        />
      )}

      {showSmsBowerCatalog && (
        <SmsBowerCatalogModal
          onClose={() => setShowSmsBowerCatalog(false)}
          onProductCreated={() => {
            setShowSmsBowerCatalog(false);
            void query.refetch();
          }}
        />
      )}
    </div>
  );
}