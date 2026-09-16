import { describe, expect, it } from "vitest";
import {
  isValidE164Number,
  matchesDialCode,
  normalizeDialCode,
  normalizePhoneNumber,
} from "../src/utils/phone.js";

describe("normalizePhoneNumber", () => {
  it("strips spaces, dashes and parentheses", () => {
    expect(normalizePhoneNumber("+1 (202) 555-0123")).toBe("+12025550123");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePhoneNumber("  +923001234567  ")).toBe("+923001234567");
  });
});

describe("normalizeDialCode", () => {
  it("removes the leading plus and formatting", () => {
    expect(normalizeDialCode("+1")).toBe("1");
    expect(normalizeDialCode("+92")).toBe("92");
  });
});

describe("isValidE164Number", () => {
  it("accepts valid international numbers", () => {
    expect(isValidE164Number("+12025550123")).toBe(true);
    expect(isValidE164Number("+923001234567")).toBe(true);
    expect(isValidE164Number("+442012345678")).toBe(true);
  });

  it("rejects numbers without a plus prefix", () => {
    expect(isValidE164Number("12025550123")).toBe(false);
  });

  it("rejects too-short or too-long numbers", () => {
    expect(isValidE164Number("+1")).toBe(false);
    expect(isValidE164Number("+1202555012399999")).toBe(false);
  });

  it("rejects non-numeric characters", () => {
    expect(isValidE164Number("+12abc")).toBe(false);
  });
});

describe("matchesDialCode", () => {
  it("returns true when the number starts with the dial code", () => {
    expect(matchesDialCode("+923001234567", "+92")).toBe(true);
    expect(matchesDialCode("+12025550123", "+1")).toBe(true);
  });

  it("returns false when the number belongs to another country code", () => {
    expect(matchesDialCode("+923001234567", "+1")).toBe(false);
  });

  it("does not match a partial prefix collision", () => {
    expect(matchesDialCode("+13405550123", "+1")).toBe(true);
  });
});