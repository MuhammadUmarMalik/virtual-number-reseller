import { numberRepository } from "../repositories/number.repository.js";
import { logger } from "../config/logger.js";
import { realtime } from "../realtime/events.js";
import { resolveVendor } from "../integrations/vendor/vendor.factory.js";

export async function runExpireNumbers() {
  const now = new Date();
  const expired = await numberRepository.listExpired(now);
  if (expired.length === 0) return;

  const ids = expired.map((number) => number.id);
  await numberRepository.markExpired(ids, now);

  for (const number of expired) {
    if (number.userId) {
      realtime.emitToUser(number.userId, "number", {
        numberId: number.id,
        status: "EXPIRED",
      });
    }
  }

  let released = 0;
  for (const number of expired) {
    if (number.vendor === "SMSBOWER" && number.vendorActivationId) {
      try {
        const vendor = resolveVendor("SMSBOWER");
        await vendor.cancelActivation({
          vendorActivationId: number.vendorActivationId,
          phoneNumber: number.phoneNumber,
          cost: "0",
          countryCode: "",
          canGetAnotherSms: false,
        });
        released += 1;
      } catch (error) {
        logger.error(
          `Failed to cancel SMSBower activation ${number.vendorActivationId}`,
          error
        );
      }
    }
  }

  logger.info(
    `Expired ${ids.length} numbers (${released} released from vendor)`
  );
}
