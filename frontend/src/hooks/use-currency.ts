import { convertPrice } from "@/lib/convert-currency";
import { formatCurrency } from "@/lib/format-currency";
import { useCurrencyStore } from "@/store/currency.store";

export function useCurrency() {
  const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
  const rates = useCurrencyStore((state) => state.rates);
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  return {
    selectedCurrency,
    rates,
    setCurrency,
    convertPrice: (amountPkr: number) =>
      convertPrice(amountPkr, selectedCurrency, rates),
    formatPrice: (amount: string | number) =>
      formatCurrency(amount, selectedCurrency, rates),
  };
}

export function useSelectedCurrency() {
  return useCurrencyStore((state) => state.selectedCurrency);
}

export function useRates() {
  return useCurrencyStore((state) => state.rates);
}