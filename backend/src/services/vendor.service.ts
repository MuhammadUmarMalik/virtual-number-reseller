import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { vendorClient } from "../integrations/vendor/vendor.client.js";
import {
  mapMobileNumbers,
  parseSmsMessages,
} from "../integrations/vendor/vendor.mapper.js";
import type {
  CountryStock,
  VendorNumber,
  VendorSmsMessage,
} from "../integrations/vendor/vendor.types.js";

interface PurchaseNumbersInput {
  projectId: string;
  quantity: number;
  serial: number;
}

interface SmsInput {
  projectId: string;
  phoneNumber: string;
  serial: number;
}

function assertConfigured(): void {
  if (!env.vendorUsername || !env.vendorApiKey) {
    throw new AppError(
      "Vendor API is not configured. Set VENDOR_USERNAME and VENDOR_API_KEY.",
      503
    );
  }
}

export const vendorService = {
  async getUserInfo() {
    assertConfigured();
    return vendorClient.getUserInfo();
  },

  async purchaseNumbers(input: PurchaseNumbersInput): Promise<VendorNumber[]> {
    assertConfigured();
    const numbers = await vendorClient.getMobile({
      pid: input.projectId,
      num: input.quantity,
      serial: input.serial,
      noblack: Number(env.vendorNoBlack) || 0,
    });

    const vendorNumbers = mapMobileNumbers(numbers, input.serial);
    if (vendorNumbers.length === 0) {
      throw new AppError("No numbers available from the vendor", 503);
    }
    return vendorNumbers;
  },

  async fetchSms(input: SmsInput): Promise<VendorSmsMessage[]> {
    assertConfigured();
    const raw = await vendorClient.getMsg({
      pid: input.projectId,
      pn: input.phoneNumber,
      serial: input.serial,
    });
    return parseSmsMessages(raw);
  },

  async releaseNumber(input: SmsInput): Promise<void> {
    assertConfigured();
    await vendorClient.passMobile({
      pid: input.projectId,
      pn: input.phoneNumber,
      serial: input.serial,
    });
  },

  async addToBlacklist(projectId: string, phoneNumber: string): Promise<void> {
    assertConfigured();
    await vendorClient.addBlack({ pid: projectId, pn: phoneNumber });
  },

  async getCountryStock(projectId?: string): Promise<CountryStock> {
    assertConfigured();
    return vendorClient.getCountryPhoneNum({
      pid: projectId || env.vendorPid || undefined,
    });
  },
};
