import { describe, expect, it } from "vitest";

import {
  addMoney,
  formatMoney,
  money,
  moneyEquals,
  positiveMoney,
  subtractMoney,
} from "./decimal.js";

describe("decimal money utilities", () => {
  it("performs base-10 arithmetic without floating point drift", () => {
    expect(formatMoney(addMoney("0.10", "0.20"))).toBe("0.30");
    expect(formatMoney(subtractMoney("10.00", "3.25"))).toBe("6.75");
    expect(moneyEquals("1.0", "1.00")).toBe(true);
  });

  it("rejects excess precision and non-positive positive-money inputs", () => {
    expect(() => money("1.001")).toThrow(/more than 2 decimal places/);
    expect(() => positiveMoney("0.00")).toThrow(/greater than zero/);
  });
});
