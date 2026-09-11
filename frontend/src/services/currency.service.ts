import { apiClient } from "@/lib/api-client";

export interface ExchangeRatesData {
  rates: Record<string, number>;
  updatedAt: string | null;
}

export async function getExchangeRates(): Promise<ExchangeRatesData> {
  return apiClient<ExchangeRatesData>("/exchange-rates");
}