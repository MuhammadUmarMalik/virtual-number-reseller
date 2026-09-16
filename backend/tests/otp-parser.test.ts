import { describe, expect, it } from "vitest";
import { extractOtp, hashMessage } from "../src/utils/otp-parser.js";

describe("extractOtp", () => {
  it("extracts a 4-8 digit code from a message", () => {
    expect(extractOtp("Your WhatsApp code is 894561")).toBe("894561");
    expect(extractOtp("code: 12345678")).toBe("12345678");
    expect(extractOtp("Use 4455 to verify")).toBe("4455");
  });

  it("returns null when no code is present", () => {
    expect(extractOtp("No code here")).toBeNull();
  });

  it("returns null for very long digit runs", () => {
    expect(extractOtp("123456789012")).toBeNull();
  });
});

describe("hashMessage", () => {
  it("is deterministic for the same input", () => {
    expect(hashMessage("+12025550123", "Your code is 1234")).toBe(
      hashMessage("+12025550123", "Your code is 1234")
    );
  });

  it("differs when the phone number differs", () => {
    expect(hashMessage("+12025550123", "Your code is 1234")).not.toBe(
      hashMessage("+12025550124", "Your code is 1234")
    );
  });
});