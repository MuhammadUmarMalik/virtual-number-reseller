import { resolveVendor } from "../integrations/vendor/vendor.factory.js";
import type { NumberVendor } from "../integrations/vendor/vendor.interface.js";
import type {
  VendorActivation,
  VendorAvailability,
} from "../integrations/vendor/vendor.types.js";
import { AppError } from "../utils/app-error.js";

interface RouteInput {
  vendor: string | undefined | null;
  country: string;
  service: string;
  quantity: number;
  secretKey?: string;
  vip?: string;
  providerId?: string;
}

export const vendorRouter = {
  getVendor(name: string | undefined | null): NumberVendor {
    return resolveVendor(name);
  },

  async purchase(input: RouteInput): Promise<VendorActivation> {
    const vendor = resolveVendor(input.vendor);

    let activation: VendorActivation;
    try {
      activation = await vendor.purchaseNumber({
        service: input.service,
        country: input.country,
        quantity: input.quantity,
        secretKey: input.secretKey,
        vip: input.vip,
        providerIds: input.providerId,
      });
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError("Unable to purchase a number right now", 503);
    }

    return activation;
  },

  async checkAvailability(
    vendorName: string,
    country: string,
    service: string,
    providerId?: string
  ): Promise<VendorAvailability[]> {
    const vendor = resolveVendor(vendorName);
    return vendor.getAvailability({ country, service, providerId });
  },
};
