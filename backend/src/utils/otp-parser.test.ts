import { describe, expect, it } from "vitest";
import {
  extractOtp,
  hashMessage,
  normalizeMessage,
} from "./otp-parser.js";

describe("normalizeMessage", () => {
  it("strips whitespace and control characters", () => {
    expect(normalizeMessage("  Your\r\n\t code  is  123456  ")).toBe(
      "Your code is 123456"
    );
  });

  it("removes byte order marks", () => {
    expect(normalizeMessage("\uFEFF123456 is your code")).toBe(
      "123456 is your code"
    );
  });

  it("returns empty string for blank input", () => {
    expect(normalizeMessage("   ")).toBe("");
  });
});

describe("extractOtp", () => {
  it("prefers the digit group next to an OTP keyword", () => {
    expect(extractOtp("Your verification code is 884412. Valid for 5 min.")).toBe(
      "884412"
    );
    expect(extractOtp("OTP: 775401 do not share")).toBe("775401");
  });

  it("falls back to the first standalone digit group", () => {
    expect(extractOtp("884412 is your code")).toBe("884412");
  });

  it("ignores short or overly long digit runs", () => {
    expect(extractOtp("No code here 123 or 9876543210")).toBeNull();
  });

  it("returns null when there is no code", () => {
    expect(extractOtp("Your account is active")).toBeNull();
    expect(extractOtp("")).toBeNull();
  });

  it("handles codes with mixed surrounding text", () => {
    expect(extractOtp("Google code: 3456. Never share it.")).toBe("3456");
  });
});

describe("hashMessage", () => {
  it("is stable for the same phone and message", () => {
    const a = hashMessage("+12345", "  Your code is  884412 ");
    const b = hashMessage("+12345", "Your code is 884412");
    expect(a).toBe(b);
  });

  it("differs across phone numbers", () => {
    const a = hashMessage("+12345", "Your code is 884412");
    const b = hashMessage("+54321", "Your code is 884412");
    expect(a).not.toBe(b);
  });

  it("differs across messages", () => {
    const a = hashMessage("+12345", "Your code is 884412");
    const b = hashMessage("+12345", "Your code is 111111");
    expect(a).not.toBe(b);
  });
});
