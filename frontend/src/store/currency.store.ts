import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const SUPPORTED_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "PKR", label: "Pakistani Rupee", symbol: "₨" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
] as const;

export const DEFAULT_CURRENCY = "PKR";

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

interface CurrencyState {
  selectedCurrency: string;
  rates: Record<string, number>;
  ratesUpdatedAt: string | null;
  setCurrency: (code: string) => void;
  setRates: (rates: Record<string, number>, updatedAt?: string | null) => void;
}

function isCurrencyCode(code: string): code is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === code);
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      selectedCurrency: DEFAULT_CURRENCY,
      rates: { USD: 1 },
      ratesUpdatedAt: null,
      setCurrency: (code) =>
        set({ selectedCurrency: isCurrencyCode(code) ? code : DEFAULT_CURRENCY }),
      setRates: (rates, updatedAt = null) =>
        set({ rates, ratesUpdatedAt: updatedAt }),
    }),
    {
      name: "currency-store",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : localStorage
      ),
      partialize: (state) => ({ selectedCurrency: state.selectedCurrency }),
    }
  )
);