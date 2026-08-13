import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { resolveVendor } from "../integrations/vendor/vendor.factory.js";

export interface LiveStockProduct {
  id: string;
  vendor: string;
  service: string;
  countryCode: string;
  vendorCountryId: string | null;
  vendorProviderId: string | null;
  vendorId: string | null;
  vip: string | null;
  needsSync: boolean;
}

interface CacheEntry {
  data: number;
  at: number;
}

const CACHE_TTL_MS = env.liveStockTtlMs;
const cache = new Map<string, CacheEntry>();

function smsbowerKey(product: LiveStockProduct): string {
  const country = (product.vendorCountryId ?? product.countryCode ?? "").trim();
  return `smsbower:${product.service}:${country}:${product.vendorProviderId ?? ""}`;
}

async function fetchSmsBowerStock(
  products: LiveStockProduct[]
): Promise<number> {
  const vendor = resolveVendor("SMSBOWER");
  const country = (products[0].vendorCountryId ?? products[0].countryCode ?? "").trim();
  const availability = await vendor.getAvailability({
    country,
    service: products[0].service,
    providerId: products[0].vendorProviderId ?? undefined,
  });
  return availability.reduce((sum, a) => sum + a.count, 0);
}

export const liveStockService = {
  async getLiveStockMap(
    products: LiveStockProduct[]
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (products.length === 0) return result;

    const groups = new Map<string, LiveStockProduct[]>();
    const needsFetch: string[] = [];

    for (const product of products) {
      if (product.needsSync) continue;
      if (product.vendor !== "SMSBOWER") continue;
      const country =
        (product.vendorCountryId ?? product.countryCode ?? "").trim();
      if (!country) continue;

      const key = smsbowerKey(product);
      const cached = cache.get(key);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        result.set(product.id, cached.data);
        continue;
      }

      const group = groups.get(key) ?? [];
      group.push(product);
      groups.set(key, group);
      needsFetch.push(key);
    }

    await Promise.all(
      [...groups.entries()].map(async ([key, group]) => {
        try {
          const data = await fetchSmsBowerStock(group);
          cache.set(key, { data, at: Date.now() });

          for (const product of group) {
            result.set(product.id, data);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(`Live stock lookup skipped for ${key}: ${message}`);
        }
      })
    );

    return result;
  },

  async getLiveStock(product: LiveStockProduct): Promise<number | null> {
    const map = await this.getLiveStockMap([product]);
    return map.has(product.id) ? (map.get(product.id) ?? null) : null;
  },

  clearCache(): void {
    cache.clear();
  },
};
