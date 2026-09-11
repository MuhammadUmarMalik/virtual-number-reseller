import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

export interface ExchangeRatesResponse {
  rates: Record<string, number>;
  updatedAt: string | null;
}

interface ExchangeRatesApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

export const exchangeRateService = {
  async syncFromExternal(): Promise<number> {
    let response: Response;
    try {
      response = await fetch(EXCHANGE_RATE_API_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(env.exchangeRateFetchTimeoutMs),
      });
    } catch (error) {
      logger.warn(
        "Exchange rate fetch failed (network error), keeping last known rates",
        error
      );
      return 0;
    }

    if (!response.ok) {
      logger.warn(
        `Exchange rate fetch failed with status ${response.status}, keeping last known rates`
      );
      return 0;
    }

    let data: ExchangeRatesApiResponse;
    try {
      data = (await response.json()) as ExchangeRatesApiResponse;
    } catch (error) {
      logger.warn("Exchange rate fetch returned invalid JSON, keeping last known rates", error);
      return 0;
    }

    if (data.result !== "success" || !data.rates) {
      logger.warn("Exchange rate fetch failed, keeping last known rates");
      return 0;
    }

    let updated = 0;
    for (const [currency, rate] of Object.entries(data.rates)) {
      await prisma.exchangeRate.upsert({
        where: { currency },
        update: { rate },
        create: { currency, rate },
      });
      updated += 1;
    }

    logger.info(`Exchange rates synced: ${updated} currencies`);
    return updated;
  },

  async getAll(): Promise<ExchangeRatesResponse> {
    const rows = await prisma.exchangeRate.findMany();
    const rates: Record<string, number> = {};
    let updatedAt: string | null = null;

    for (const row of rows) {
      rates[row.currency] = Number(row.rate);
      if (!updatedAt || row.updatedAt.toISOString() > updatedAt) {
        updatedAt = row.updatedAt.toISOString();
      }
    }

    return { rates, updatedAt };
  },
};