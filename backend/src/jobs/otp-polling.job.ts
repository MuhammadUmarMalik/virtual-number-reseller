import { prisma } from "../config/database.js";
import { logger } from "../config/logger.js";
import { numberRepository } from "../repositories/number.repository.js";
import { createNotification } from "../services/audit.service.js";
import { syncNumberOtps } from "../services/number.service.js";

const POLL_BATCH = 50;

export async function runOtpPolling() {
  const now = new Date();
  const numbers = await numberRepository.listForOtpPolling(now, POLL_BATCH);
  if (numbers.length === 0) return;

  let newOtps = 0;
  for (const number of numbers) {
    try {
      const { savedCount } = await syncNumberOtps(number);
      if (savedCount > 0) {
        newOtps += savedCount;
        await createNotification(prisma, {
          userId: number.userId,
          title: "New OTP received",
          message: `A new OTP was received for ${number.phoneNumber}.`,
          type: "OTP",
        });
      }
    } catch (error) {
      logger.error(`OTP polling failed for number ${number.id}`, error);
    }
  }

  if (newOtps > 0) {
    logger.info(`OTP polling saved ${newOtps} new messages`);
  }
}
