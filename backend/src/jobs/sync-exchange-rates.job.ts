import { exchangeRateService } from "../services/exchange-rate.service.js";

export async function runSyncExchangeRates(): Promise<void> {
  await exchangeRateService.syncFromExternal();
}