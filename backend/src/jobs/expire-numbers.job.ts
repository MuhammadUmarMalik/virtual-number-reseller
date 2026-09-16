import { numberRepository } from "../repositories/number.repository.js";
import { smsbowerActivationService } from "../services/smsbower-activation.service.js";
import { logger } from "../config/logger.js";

export async function runExpireNumbers() {
  const now = new Date();
  const expired = await numberRepository.listExpired(now);
  if (expired.length === 0) return;

  // An SMSBower activation that never delivered an OTP is cancelled on the
  // vendor and its money returned to the wallet instead of being marked
  // (non-refundable) EXPIRED. Numbers that did receive an OTP expire normally.
  const refundable = expired.filter(
    (number) =>
      number.vendorActivationId &&
      number.status !== "RECEIVED" &&
      number.otpCount === 0
  );
  const plain = expired.filter((number) => !refundable.includes(number));

  let refundedCount = 0;
  for (const number of refundable) {
    try {
      const result = await smsbowerActivationService.cancelActivation(number.id);
      if (result.refunded) refundedCount += 1;
    } catch (error) {
      logger.error(`Auto-refund failed for number ${number.id}`, error);
    }
  }

  if (plain.length > 0) {
    await numberRepository.markExpired(
      plain.map((number) => number.id),
      now
    );
  }

  if (refundedCount > 0) {
    logger.info(`Auto-refunded ${refundedCount} SMSBower number(s) without an OTP`);
  }
}
