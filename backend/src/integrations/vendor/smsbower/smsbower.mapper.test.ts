import { describe, expect, it, vi } from "vitest";
import { SmsBowerVendor } from "./smsbower.mapper.js";
import { smsbowerClient } from "./smsbower.client.js";

vi.mock("./smsbower.client.js", () => ({
  smsbowerClient: {
    getBalance: vi.fn(),
    getServices: vi.fn(),
    getCountries: vi.fn(),
    getPricesV3: vi.fn(),
    getNumberV2: vi.fn(),
    getStatus: vi.fn(),
    setStatus: vi.fn(),
    resolveServiceCode: vi.fn((service: string) => Promise.resolve(service)),
  },
}));

describe("SmsBowerVendor", () => {
  describe("getBalance", () => {
    it("parses ACCESS_BALANCE response", async () => {
      vi.mocked(smsbowerClient.getBalance).mockResolvedValue("100.50");

      const vendor = new SmsBowerVendor();
      const result = await vendor.getBalance();

      expect(result).toEqual({ balance: "100.50", currency: "USD" });
    });
  });

  describe("getActivationStatus", () => {
    const vendor = new SmsBowerVendor();

    it("returns WAITING for STATUS_WAIT_CODE", async () => {
      vi.mocked(smsbowerClient.getStatus).mockResolvedValue("STATUS_WAIT_CODE");
      const result = await vendor.getActivationStatus({
        vendorActivationId: "123",
        phoneNumber: "+123456789",
        cost: "0",
        countryCode: "1",
        canGetAnotherSms: true,
      });
      expect(result).toEqual({ status: "WAITING" });
    });

    it("returns SMS_RECEIVED with OTP for STATUS_OK", async () => {
      vi.mocked(smsbowerClient.getStatus).mockResolvedValue("STATUS_OK:123456");
      const result = await vendor.getActivationStatus({
        vendorActivationId: "123",
        phoneNumber: "+123456789",
        cost: "0",
        countryCode: "1",
        canGetAnotherSms: true,
      });
      expect(result).toEqual({ status: "SMS_RECEIVED", otp: "123456" });
    });

    it("returns CANCELLED for STATUS_CANCEL", async () => {
      vi.mocked(smsbowerClient.getStatus).mockResolvedValue("STATUS_CANCEL");
      const result = await vendor.getActivationStatus({
        vendorActivationId: "123",
        phoneNumber: "+123456789",
        cost: "0",
        countryCode: "1",
        canGetAnotherSms: true,
      });
      expect(result).toEqual({ status: "CANCELLED" });
    });
  });

  describe("purchaseNumber", () => {
    it("resolves display-name service to code before calling getNumberV2", async () => {
      vi.mocked(smsbowerClient.resolveServiceCode).mockResolvedValue("fb");
      vi.mocked(smsbowerClient.getNumberV2).mockResolvedValue({
        activationId: "987654",
        phoneNumber: 1234567890,
        activationCost: "0.50",
        countryCode: "1",
        canGetAnotherSms: true,
        activationTime: "2026-01-01",
        activationOperator: "AT&T",
      });

      const vendor = new SmsBowerVendor();
      const result = await vendor.purchaseNumber({
        service: "Facebook",
        country: "1",
        quantity: 1,
      });

      expect(smsbowerClient.resolveServiceCode).toHaveBeenCalledWith("Facebook");
      expect(smsbowerClient.getNumberV2).toHaveBeenCalledWith(
        expect.objectContaining({ service: "fb", country: "1" })
      );
      expect(result.vendorActivationId).toBe("987654");
      expect(result.phoneNumber).toBe("1234567890");
    });
  });

  describe("getAvailability", () => {
    it("looks up prices using the resolved service code", async () => {
      vi.mocked(smsbowerClient.resolveServiceCode).mockResolvedValue("fb");
      vi.mocked(smsbowerClient.getPricesV3).mockResolvedValue({
        "1": {
          fb: {
            "5": { price: 0.5, count: 10, provider_id: 5 },
          },
        },
      });

      const vendor = new SmsBowerVendor();
      const result = await vendor.getAvailability({
        service: "Facebook",
        country: "1",
      });

      expect(smsbowerClient.getPricesV3).toHaveBeenCalledWith(
        expect.objectContaining({ service: "fb", country: "1" })
      );
      expect(result).toEqual([
        {
          country: "1",
          service: "fb",
          cost: "0.5",
          count: 10,
          providerId: "5",
        },
      ]);
    });

    it("returns empty when the service key is missing after resolution", async () => {
      vi.mocked(smsbowerClient.resolveServiceCode).mockResolvedValue("wa");
      vi.mocked(smsbowerClient.getPricesV3).mockResolvedValue({
        "1": { fb: { "5": { price: 0.5, count: 10, provider_id: 5 } } },
      });

      const vendor = new SmsBowerVendor();
      const result = await vendor.getAvailability({
        service: "WhatsApp",
        country: "1",
      });

      expect(result).toEqual([]);
    });
  });

  describe("completeActivation", () => {
    it("returns success for ACCESS_ACTIVATION", async () => {
      vi.mocked(smsbowerClient.setStatus).mockResolvedValue("ACCESS_ACTIVATION");

      const vendor = new SmsBowerVendor();
      const result = await vendor.completeActivation({
        vendorActivationId: "123",
        phoneNumber: "+123456789",
        cost: "0",
        countryCode: "1",
        canGetAnotherSms: true,
      });

      expect(result.success).toBe(true);
    });
  });
});
