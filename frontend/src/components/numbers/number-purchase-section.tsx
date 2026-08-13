"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { BuyModal } from "@/components/orders/buy-modal";
import { ProductCard } from "@/components/numbers/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getProducts } from "@/services/product.service";
import type { ProductSummary } from "@/types/content.types";

export function NumberPurchaseSection() {
  const [buyingProduct, setBuyingProduct] = useState<ProductSummary | null>(null);
  const [handledBuyParam, setHandledBuyParam] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const buyParam = searchParams.get("buy");

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => getProducts({ limit: 50 }),
    refetchInterval: 30_000,
  });

  const products = productsQuery.data?.items ?? [];

  const presetProduct = buyParam
    ? products.find((item) => item.id === buyParam) ?? null
    : null;

  if (presetProduct && buyParam !== handledBuyParam) {
    setBuyingProduct(presetProduct);
    setHandledBuyParam(buyParam);
  }

  useEffect(() => {
    if (!handledBuyParam) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("buy");
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
  }, [handledBuyParam, router]);

  if (productsQuery.isLoading) {
    return <LoadingState label="Loading available numbers..." variant="grid" />;
  }

  if (productsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load numbers"
        description="We could not fetch available numbers. Please try again in a moment."
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No numbers available"
        description="No numbers are available right now. Check back soon."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onBuy={setBuyingProduct}
          />
        ))}
      </div>

      <BuyModal
        product={buyingProduct}
        onClose={() => setBuyingProduct(null)}
      />
    </div>
  );
}
