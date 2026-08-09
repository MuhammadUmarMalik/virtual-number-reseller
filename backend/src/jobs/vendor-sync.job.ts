import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { vendorService } from "../services/vendor.service.js";

export async function runVendorSync() {
  if (!env.vendorUsername || !env.vendorApiKey) {
    return;
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, countryCode: true, vendorId: true },
  });
  if (products.length === 0) return;

  let updated = 0;
  for (const product of products) {
    const projectId = product.vendorId || env.vendorPid;
    if (!projectId) continue;

    try {
      const stock = await vendorService.getCountryStock(projectId);
      const country = product.countryCode.toLowerCase();
      const available = stock[country];
      if (available === undefined) continue;

      await prisma.product.update({
        where: { id: product.id },
        data: { availableStock: available },
      });
      updated += 1;
    } catch (error) {
      logger.error(`Vendor stock sync failed for product ${product.id}`, error);
    }
  }

  if (updated > 0) {
    logger.info(`Vendor stock sync updated ${updated} products`);
  }
}
