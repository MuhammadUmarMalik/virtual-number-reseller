import { Package, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import type { ProductSummary } from "@/types/content.types";

interface ProductCardProps {
  product: ProductSummary;
  onBuy: (product: ProductSummary) => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const outOfStock = product.availableStock <= 0;
  const { formatPrice } = useCurrency();

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold tracking-tight">{product.name}</h3>
        {outOfStock ? (
          <Badge variant="warning">Out of stock</Badge>
        ) : (
          <Badge variant="success">In stock</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {product.country} • {product.service} • {product.numberType}
      </p>

      <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
        <p className="text-lg font-semibold tracking-tight">
          {formatPrice(product.sellingPrice)}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5" />
          {product.availableStock} available
        </span>
      </div>

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={outOfStock}
        onClick={() => onBuy(product)}
      >
        <ShoppingCart className="h-4 w-4" />
        Buy Number
      </Button>
    </div>
  );
}
