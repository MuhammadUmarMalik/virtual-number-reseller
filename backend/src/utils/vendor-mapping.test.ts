import { describe, expect, it } from "vitest";
import {
  mapVendorFlagToBoolean,
  normalizeNullableString,
  normalizePhoneNumber,
} from "./vendor-mapping.js";

describe("mapVendorFlagToBoolean", () => {
  it.each([
    ["1", true],
    ["0", false],
    ["true", true],
    ["TRUE", true],
    ["false", false],
    ["", false],
    ["yes", false],
    [1, true],
    [0, false],
    [2, false],
    [true, true],
    [false, false],
    [null, null],
    [undefined, null],
    [{}, null],
    [[], null],
  ] as const)("maps %o -> %o without throwing", (input, expected) => {
    expect(mapVendorFlagToBoolean(input)).toBe(expected);
  });
});

describe("normalizePhoneNumber", () => {
  it("strips a leading + prefix", () => {
    expect(normalizePhoneNumber("+59173841704")).toBe("59173841704");
  });

  it("keeps plain digit strings", () => {
    expect(normalizePhoneNumber("1234567890")).toBe("1234567890");
  });

  it("stringifies numbers", () => {
    expect(normalizePhoneNumber(1234567890)).toBe("1234567890");
  });

  it("returns empty string for null/undefined", () => {
    expect(normalizePhoneNumber(null)).toBe("");
    expect(normalizePhoneNumber(undefined)).toBe("");
  });
});

describe("normalizeNullableString", () => {
  it("keeps non-empty strings trimmed", () => {
    expect(normalizeNullableString("  AT&T ")).toBe("AT&T");
  });

  it("maps empty/whitespace to null", () => {
    expect(normalizeNullableString("")).toBe(null);
    expect(normalizeNullableString("   ")).toBe(null);
  });

  it("maps null/undefined to null", () => {
    expect(normalizeNullableString(null)).toBe(null);
    expect(normalizeNullableString(undefined)).toBe(null);
  });

  it("stringifies numbers", () => {
    expect(normalizeNullableString(123)).toBe("123");
  });
});
