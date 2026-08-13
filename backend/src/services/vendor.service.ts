import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { productRepository } from "../repositories/product.repository.js";
import { resolveVendor } from "../integrations/vendor/vendor.factory.js";
import { vendorRouter } from "./vendor-router.service.js";

const STOCK_SYNC_TTL_MS = 30_000;
let lastStockSyncAt = 0;
let stockSyncInFlight: Promise<number> | null = null;

export async function syncVendorStock(): Promise<number> {
  if (stockSyncInFlight) return stockSyncInFlight;

  if (Date.now() - lastStockSyncAt < STOCK_SYNC_TTL_MS) {
    return 0;
  }

  stockSyncInFlight = (async () => {
    const products = await productRepository.findStockSyncable();
    if (products.length === 0) return 0;

    let updated = 0;

    const smsbowerProducts = products.filter((p) => p.vendor === "SMSBOWER");
    if (smsbowerProducts.length > 0 && env.smsbowerApiKey) {
      updated += await syncSmsBowerStock(smsbowerProducts);
    }

    lastStockSyncAt = Date.now();
    return updated;
  })().finally(() => {
    stockSyncInFlight = null;
  });

  return stockSyncInFlight;
}

async function syncSmsBowerStock(
  products: Array<{ id: string; countryCode: string; vendorCountryId: string | null; vendorProviderId: string | null; needsSync: boolean; service: string; vendorId: string | null }>
): Promise<number> {
  const vendor = resolveVendor("SMSBOWER");
  const byServiceCountry = new Map<string, typeof products>();

  for (const product of products) {
    if (product.needsSync) continue;
    const vendorCountryId = (product.vendorCountryId ?? product.countryCode ?? "").trim();
    if (!/^\d+$/.test(vendorCountryId)) continue;
    const key = `${product.service}::${vendorCountryId}::${product.vendorProviderId ?? ""}`;
    const group = byServiceCountry.get(key) ?? [];
    group.push(product);
    byServiceCountry.set(key, group);
  }

  let updated = 0;
  for (const [key, group] of byServiceCountry.entries()) {
    const [service, country, providerId] = key.split("::");
    try {
      const availability = await vendor.getAvailability({
        country,
        service,
        providerId: providerId || undefined,
      });
      const totalCount = availability.reduce((sum, a) => sum + a.count, 0);
      for (const product of group) {
        await productRepository.updateStock(product.id, totalCount);
        updated += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `SMSBower stock sync skipped for ${service}/${country}${providerId ? `/provider-${providerId}` : ""}: ${message}`
      );
    }
  }
  return updated;
}

export const vendorService = {
  vendorRouter,

  async getVendorBalance(vendorName: string): Promise<{ balance: string; currency: string }> {
    const vendor = resolveVendor(vendorName);
    return vendor.getBalance();
  },
};
