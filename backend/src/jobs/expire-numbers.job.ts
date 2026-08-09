import { numberRepository } from "../repositories/number.repository.js";
import { logger } from "../config/logger.js";

export async function runExpireNumbers() {
  const now = new Date();
  const expired = await numberRepository.listExpired(now);
  if (expired.length === 0) return;

  const ids = expired.map((number) => number.id);
  await numberRepository.markExpired(ids, now);
  logger.info(`Expired ${ids.length} numbers`);
}
