import { describe, expect, it } from "vitest";
import { parseVendorReservationResponse } from "./index";

describe("parseVendorReservationResponse", () => {
  it("validates and normalizes a vendor reservation response", () => {
    const result = parseVendorReservationResponse(
      "14633023941|https://vendor.example.com/sms/facebook/activation-id",
      ["vendor.example.com"],
      true,
    );

    expect(result.phoneNumber).toBe("14633023941");
    expect(result.vendorActivationId).toBe("activation-id");
    expect(result.status).toBe("WAITING_FOR_OTP");
  });

  it("rejects unapproved hostnames", () => {
    expect(() =>
      parseVendorReservationResponse(
        "14633023941|https://evil.example.com/sms/facebook/activation-id",
        ["vendor.example.com"],
        true,
      ),
    ).toThrow("hostname");
  });
});
