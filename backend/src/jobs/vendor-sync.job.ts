import { logger } from "../config/logger.js";
import { syncVendorStock } from "../services/vendor.service.js";

export async function runVendorSync() {
  try {
    const updated = await syncVendorStock();
    if (updated > 0) {
      logger.info(`Vendor stock sync updated ${updated} products`);
    }
  } catch (error) {
    logger.error("Vendor stock sync failed", error);
  }
}
