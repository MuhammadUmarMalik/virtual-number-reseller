import { convertPrice, LEDGER_CURRENCY } from "@/lib/convert-currency";
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

// Digit layout is always en-US so the comma groups thousands and the point
// separates decimals in every currency — e.g. EUR no longer renders "1.234,56".
function formatAmountDigits(value: number, hasDecimals: boolean): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  }).format(value);
}

function currencySymbol(currency: string, locale: string): string {
  try {
    return (
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
      })
        .formatToParts(1)
        .find((part) => part.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

export function formatCurrency(
  amount: string | number,
  currency: string = DEFAULT_CURRENCY,
  rates: Record<string, number> = { USD: 1 },
  baseCurrency: string = LEDGER_CURRENCY
): string {
  const value =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(value)) {
    return "0";
  }

  const converted = convertPrice(value, currency, rates, baseCurrency);
  const hasDecimals = !NO_DECIMAL_CURRENCIES.has(currency);
  const symbol = currencySymbol(currency, CURRENCY_LOCALES[currency] ?? "en-US");

  return `${symbol} ${formatAmountDigits(converted, hasDecimals)}`.trim();
}

export function getCurrencySymbol(currency: string = DEFAULT_CURRENCY): string {
  return currencySymbol(currency, CURRENCY_LOCALES[currency] ?? "en-US");
}