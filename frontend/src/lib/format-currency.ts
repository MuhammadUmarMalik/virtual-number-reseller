import { convertPrice } from "@/lib/convert-currency";
import { DEFAULT_CURRENCY } from "@/store/currency.store";

const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  PKR: "en-PK",
  INR: "en-IN",
  GBP: "en-GB",
  EUR: "de-DE",
  JPY: "ja-JP",
};

const NO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "VND"]);

export function formatCurrency(
  amount: string | number,
  currency: string = DEFAULT_CURRENCY,
  rates: Record<string, number> = { USD: 1 }
): string {
  const value =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(value)) {
    return "0";
  }

  const converted = convertPrice(value, currency, rates);
  const hasDecimals = !NO_DECIMAL_CURRENCIES.has(currency);

  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(converted);
}

export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(1)
      .find((part) => part.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}