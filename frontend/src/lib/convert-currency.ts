// Rates are units of each currency per 1 USD (rate["USD"] = 1,
// rate["PKR"] = ~280) from the daily ER-API sync.
// Amounts carry their own source currency: ledger values (wallet, orders,
// top-ups, refunds) are PKR while product prices are stored in their
// `Product.currency` (usually USD).
export const LEDGER_CURRENCY = "PKR";

export function convertPrice(
  amount: number,
  targetCurrency: string,
  rates: Record<string, number>,
  baseCurrency: string = LEDGER_CURRENCY
): number {
  if (!Number.isFinite(amount)) {
    return 0;
  }
  if (targetCurrency === baseCurrency) {
    return amount;
  }
  const baseRate = rates[baseCurrency] ?? 1;
  const targetRate = rates[targetCurrency] ?? 1;
  if (baseRate <= 0 || targetRate <= 0) {
    return amount;
  }
  return (amount * targetRate) / baseRate;
}