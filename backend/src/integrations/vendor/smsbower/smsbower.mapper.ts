import type { NumberVendor } from "../vendor.interface.js";
import type {
  VendorActivation,
  VendorActivationStatus,
  VendorActionResult,
  VendorAvailability,
  VendorBalance,
  VendorCountry,
  VendorPurchaseParams,
  VendorService,
} from "../vendor.types.js";
import { smsbowerClient } from "./smsbower.client.js";
import { logger } from "../../../config/logger.js";
import { AppError } from "../../../utils/app-error.js";
import {
  mapVendorFlagToBoolean,
  normalizeNullableString,
  normalizePhoneNumber,
} from "../../../utils/vendor-mapping.js";
import { z } from "zod";
import {
  SMSBOWER_ACTION,
  type SmsBowerNumberResponse,
} from "./smsbower.types.js";

const SmsBowerNumberResponseSchema = z.object({
  activationId: z.union([z.string(), z.number()]),
  phoneNumber: z.union([z.string(), z.number()]),
  activationCost: z.union([z.string(), z.number()]).optional(),
  countryCode: z.union([z.string(), z.number()]).optional(),
  canGetAnotherSms: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
  activationTime: z.string().optional(),
  activationOperator: z.string().nullable().optional(),
});

export class SmsBowerVendor implements NumberVendor {
  readonly name = "SMSBOWER";

  async getBalance(): Promise<VendorBalance> {
    const balance = await smsbowerClient.getBalance();
    return { balance, currency: "USD" };
  }

  async getServices(): Promise<VendorService[]> {
    const response = await smsbowerClient.getServices();
    if (response.status !== "success") {
      return [];
    }
    return response.services.map((s) => ({
      code: s.code,
      name: s.name,
    }));
  }

  async getCountries(): Promise<VendorCountry[]> {
    const response = await smsbowerClient.getCountries();
    return response.map((c) => ({
      id: c.id,
      name: c.eng,
    }));
  }

  async getAvailability(params: {
    country: string;
    service: string;
    providerId?: string;
  }): Promise<VendorAvailability[]> {
    const service = await smsbowerClient.resolveServiceCode(params.service);
    const prices = await smsbowerClient.getPricesV3({
      service,
      country: params.country,
    });
    const result: VendorAvailability[] = [];

    const countryData = prices[params.country];
    if (!countryData) return result;

    const serviceData = countryData[service];
    if (!serviceData) return result;

    for (const [, provider] of Object.entries(serviceData)) {
      if (
        params.providerId &&
        String(provider.provider_id) !== String(params.providerId)
      ) {
        continue;
      }
      result.push({
        country: params.country,
        service,
        cost: String(provider.price),
        count: provider.count,
        providerId: String(provider.provider_id),
      });
    }

    logger.debug(
      `[smsbower:getAvailability] country=${params.country} service=${service} raw=${JSON.stringify(prices[params.country]?.[service])} total=${result.reduce((sum, a) => sum + a.count, 0)}`
    );

    return result;
  }

  async purchaseNumber(
    params: VendorPurchaseParams
  ): Promise<VendorActivation> {
    const service = await smsbowerClient.resolveServiceCode(params.service);
    const response = await smsbowerClient.getNumberV2({
      service,
      country: params.country,
      maxPrice: params.maxPrice,
      minPrice: params.minPrice,
      providerIds: params.providerIds,
    });
    return mapNumberResponse(response);
  }

  async getActivationStatus(
    activation: VendorActivation
  ): Promise<VendorActivationStatus> {
    const text = await smsbowerClient.getStatus(
      activation.vendorActivationId
    );

    if (text === "STATUS_WAIT_CODE") {
      return { status: "WAITING" };
    }
    if (text.startsWith("STATUS_WAIT_RETRY:")) {
      return { status: "WAITING" };
    }
    if (text === "STATUS_CANCEL") {
      return { status: "CANCELLED" };
    }
    if (text.startsWith("STATUS_OK:")) {
      const otp = text.replace("STATUS_OK:", "");
      return { status: "SMS_RECEIVED", otp };
    }

    return { status: "WAITING" };
  }

  async cancelActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult> {
    const text = await smsbowerClient.setStatus(
      activation.vendorActivationId,
      SMSBOWER_ACTION.CANCEL
    );
    if (text === "ACCESS_CANCEL") {
      return { success: true, message: "Activation cancelled" };
    }
    return { success: false, message: text };
  }

  async requestAnotherSms(
    activation: VendorActivation
  ): Promise<VendorActionResult> {
    const text = await smsbowerClient.setStatus(
      activation.vendorActivationId,
      SMSBOWER_ACTION.RETRY
    );
    if (text === "ACCESS_RETRY_GET") {
      return { success: true, message: "Waiting for another SMS" };
    }
    return { success: false, message: text };
  }

  async completeActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult> {
    const text = await smsbowerClient.setStatus(
      activation.vendorActivationId,
      SMSBOWER_ACTION.COMPLETE
    );
    if (text === "ACCESS_ACTIVATION") {
      return { success: true, message: "Activation completed" };
    }
    return { success: false, message: text };
  }
}

function mapNumberResponse(response: SmsBowerNumberResponse): VendorActivation {
  const parsed = SmsBowerNumberResponseSchema.safeParse(response);
  if (!parsed.success) {
    logger.error(
      `[smsbower:getNumberV2] unexpected response shape: ${JSON.stringify(response)}`
    );
    throw new AppError("Vendor response shape changed", 502);
  }

  const data = parsed.data;
  return {
    vendorActivationId: String(data.activationId),
    phoneNumber: normalizePhoneNumber(data.phoneNumber),
    cost: data.activationCost !== undefined ? String(data.activationCost) : "0",
    countryCode: data.countryCode !== undefined ? String(data.countryCode) : "",
    canGetAnotherSms: mapVendorFlagToBoolean(data.canGetAnotherSms),
    operator: normalizeNullableString(data.activationOperator),
    additionalData: {
      activationTime: data.activationTime,
    },
  };
}
