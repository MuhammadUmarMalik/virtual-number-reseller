import { Prisma } from "@prisma/client";

export const MONEY_SCALE = 2;
export const MONEY_ZERO = new Prisma.Decimal(0);

export type MoneyInput = Prisma.Decimal | string;

export function decimal(value: MoneyInput): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
}

export function money(value: MoneyInput): Prisma.Decimal {
  const amount = decimal(value);

  if (!amount.isFinite()) {
    throw new RangeError("Money must be a finite decimal value.");
  }

  if (amount.decimalPlaces() > MONEY_SCALE) {
    throw new RangeError(`Money cannot have more than ${MONEY_SCALE} decimal places.`);
  }

  return amount.toDecimalPlaces(MONEY_SCALE);
}

export function positiveMoney(value: MoneyInput): Prisma.Decimal {
  const amount = money(value);

  if (!amount.greaterThan(0)) {
    throw new RangeError("Money must be greater than zero.");
  }

  return amount;
}

export function addMoney(...values: MoneyInput[]): Prisma.Decimal {
  return values.reduce<Prisma.Decimal>((total, value) => total.plus(money(value)), MONEY_ZERO);
}

export function subtractMoney(minuend: MoneyInput, subtrahend: MoneyInput): Prisma.Decimal {
  return money(minuend).minus(money(subtrahend)).toDecimalPlaces(MONEY_SCALE);
}

export function formatMoney(value: MoneyInput): string {
  return money(value).toFixed(MONEY_SCALE);
}

export function moneyEquals(left: MoneyInput, right: MoneyInput): boolean {
  return money(left).equals(money(right));
}
