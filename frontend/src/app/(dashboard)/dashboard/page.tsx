"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, BookOpen, Clock3 } from "lucide-react";

import { WalletHero } from "@/components/dashboard/wallet-hero";
import { BuyModal } from "@/components/orders/buy-modal";
import { ProductCard } from "@/components/numbers/product-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { getProducts } from "@/services/product.service";
import { getDashboard } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/format-currency";
import { useAuthStore } from "@/store/auth.store";
import type { ProductSummary } from "@/types/content.types";

export default function DashboardPage() {
  const [buyingProduct, setBuyingProduct] = useState<ProductSummary | null>(
    null,
  );
  const user = useAuthStore((state) => state.user);

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
      <div className="animate-fade-up">
        <WalletHero
          balance={dashboard.walletBalance}
          userName={user?.fullName ?? "there"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Orders"
          value={dashboard.totalOrders}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <StatCard
          title="Active Numbers"
          value={dashboard.activeNumbers}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Total OTPs"
          value={dashboard.otpCount}
          icon={<Clock3 className="h-5 w-5" />}
        />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Available Numbers
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pick a service and start receiving OTPs
            </p>
          </div>
          <Link
            href="/active-numbers"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            My numbers <ArrowRight className="h-4 w-4" />
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
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Orders
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your latest purchases
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {dashboard.recentOrders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Buy your first number to get started."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {order.orderCode}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <BuyModal
        product={buyingProduct}
        onClose={() => setBuyingProduct(null)}
      />
    </div>
  );
}
