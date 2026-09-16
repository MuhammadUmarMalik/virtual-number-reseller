import { convertPrice, LEDGER_CURRENCY } from "@/lib/convert-currency";
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
    convertPrice: (amount: number, baseCurrency: string = LEDGER_CURRENCY) =>
      convertPrice(amount, selectedCurrency, rates, baseCurrency),
    formatPrice: (amount: string | number, baseCurrency?: string) =>
      formatCurrency(amount, selectedCurrency, rates, baseCurrency),
  };
}

export function useSelectedCurrency() {
  return useCurrencyStore((state) => state.selectedCurrency);
}

export function useRates() {
  return useCurrencyStore((state) => state.rates);
}