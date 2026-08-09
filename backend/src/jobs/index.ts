import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { settingsService } from "../services/settings.service.js";
import { runExpireNumbers } from "./expire-numbers.job.js";
import { runOtpPolling } from "./otp-polling.job.js";
import { runVendorSync } from "./vendor-sync.job.js";

function schedule(name: string, intervalMs: number, task: () => Promise<void>) {
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await task();
    } catch (error) {
      logger.error(`Job "${name}" failed`, error);
    } finally {
      running = false;
    }
  }, intervalMs);
  timer.unref();
}

export async function startJobs() {
  if (env.nodeEnv === "test") return;

  const pollingSetting = await settingsService.get("otp_polling_interval");
  const pollingSeconds = Number(pollingSetting);
  const pollingIntervalMs =
    Number.isFinite(pollingSeconds) && pollingSeconds > 0
      ? pollingSeconds * 1000
      : env.otpPollingIntervalMs;

  schedule("otp-polling", pollingIntervalMs, runOtpPolling);
  schedule("expire-numbers", env.expireNumbersIntervalMs, runExpireNumbers);
  schedule("vendor-sync", env.vendorSyncIntervalMs, runVendorSync);

  logger.info("Background jobs started");
}
