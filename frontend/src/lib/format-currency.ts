export function formatCurrency(amount: string | number): string {
  const value =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
