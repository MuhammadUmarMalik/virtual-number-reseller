"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import { formatCurrency } from "@/lib/format-currency";
import { getAdminProducts } from "@/services/admin.service";
import type { Product } from "@/types/order.types";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const query = useQuery({
    queryKey: ["admin", "products", page],
    queryFn: () => getAdminProducts({ page, limit: 20 }),
  });

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
          <Button type="button" onClick={() => setShowCreate(true)}>
            Add Product
          </Button>
        }
      />

      {data.items.length === 0 ? (
        <EmptyState
          title="No products yet"
          icon={<Package className="h-6 w-6" />}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
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
                    <td className="px-4 py-3 text-muted-foreground">{product.country}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.service}</td>
                    <td className="px-4 py-3 text-muted-foreground">{product.numberType}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.availableStock}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(product)}
                      >
                        Edit
                      </Button>
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
    </div>
  );
}
