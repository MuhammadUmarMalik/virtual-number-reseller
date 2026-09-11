"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from "@/lib/format-currency";
import { useCurrency } from "@/hooks/use-currency";
import {
  SUPPORTED_CURRENCIES,
  useCurrencyStore,
} from "@/store/currency.store";

export function CurrencySelector() {
  const { selectedCurrency, setCurrency } = useCurrency();
  const ratesUpdatedAt = useCurrencyStore((state) => state.ratesUpdatedAt);

  const [open, setOpen] = useState(false);

  const lastUpdated = ratesUpdatedAt
    ? new Date(ratesUpdatedAt).toLocaleString()
    : "N/A";

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-1.5 px-2.5 text-sm"
          aria-label="Select currency"
        >
          <Coins className="h-4 w-4" />
          <span>{selectedCurrency}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Display currency
          </DropdownMenu.Label>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <DropdownMenu.Item
              key={currency.code}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
                currency.code === selectedCurrency && "font-medium"
              )}
              onSelect={() => setCurrency(currency.code)}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-muted-foreground">
                  {getCurrencySymbol(currency.code)}
                </span>
                <span>{currency.code}</span>
                <span className="text-xs text-muted-foreground">
                  {currency.label}
                </span>
              </span>
              {currency.code === selectedCurrency && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1.5 h-px bg-border" />
          <DropdownMenu.Label className="px-2 py-1 text-xs text-muted-foreground">
            Rates: open.er-api.com · Updated {lastUpdated}
          </DropdownMenu.Label>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}