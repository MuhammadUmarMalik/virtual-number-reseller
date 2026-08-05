import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import type { ProductSummary } from "@/types/content.types";

interface ProductCardProps {
  product: ProductSummary;
  onBuy: (product: ProductSummary) => void;
}

export function ProductCard({ product, onBuy }: ProductCardProps) {
  const outOfStock = product.availableStock <= 0;

  return (
    <Card className="flex flex-col p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{product.name}</h3>
        {outOfStock ? (
          <Badge variant="warning">Out of stock</Badge>
        ) : (
          <Badge variant="success">In stock</Badge>
        )}
      </div>
      <p className="text-sm text-slate-500">
        {product.country} • {product.service} • {product.numberType}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-900">
          {formatCurrency(product.sellingPrice)}
        </p>
        <p className="text-xs text-slate-400">
          {product.availableStock} available
        </p>
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
    </Card>
  );
}
