const PKR = "PKR";

// Stored amounts are PKR. Rates are units of each currency per 1 USD
// (rate["USD"] = 1, rate["PKR"] = ~280) from the daily ER-API sync.
export function convertPrice(
  amountPkr: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  if (!Number.isFinite(amountPkr)) {
    return 0;
  }
  if (targetCurrency === PKR) {
    return amountPkr;
  }
  const pkrRate = rates[PKR] ?? 1;
  const targetRate = rates[targetCurrency] ?? 1;
  if (pkrRate <= 0 || targetRate <= 0) {
    return amountPkr;
  }
  return (amountPkr * targetRate) / pkrRate;
}