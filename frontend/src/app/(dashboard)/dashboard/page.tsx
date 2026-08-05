"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wallet } from "lucide-react";

import { BuyModal } from "@/components/orders/buy-modal";
import { ProductCard } from "@/components/numbers/product-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getProducts } from "@/services/product.service";
import { getDashboard } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/format-currency";
import type { ProductSummary } from "@/types/content.types";

export default function DashboardPage() {
  const [buyingProduct, setBuyingProduct] = useState<ProductSummary | null>(null);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts({ limit: 12 }),
  });

  if (dashboardQuery.isLoading || productsQuery.isLoading) {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (
    dashboardQuery.isError ||
    productsQuery.isError ||
    !dashboardQuery.data ||
    !productsQuery.data
  ) {
    return (
      <ErrorState
        message="Unable to load your dashboard."
        onRetry={() => {
          void dashboardQuery.refetch();
          void productsQuery.refetch();
        }}
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const products = productsQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Buy numbers and manage your account"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Wallet Balance"
          value={formatCurrency(dashboard.walletBalance)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard title="Total Orders" value={dashboard.totalOrders} />
        <StatCard title="Active Numbers" value={dashboard.activeNumbers} />
        <StatCard title="Total OTPs" value={dashboard.otpCount} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Available Numbers</h2>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Top up wallet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {products.items.length === 0 ? (
          <EmptyState
            title="No products available"
            description="New numbers are added regularly. Please check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={setBuyingProduct}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {dashboard.recentOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No orders yet. Buy your first number to get started.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {order.orderCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BuyModal product={buyingProduct} onClose={() => setBuyingProduct(null)} />
    </div>
  );
}
