import { smsbowerClient } from "../integrations/vendor/smsbower/smsbower.client.js";
import { AppError } from "../utils/app-error.js";
import type { SmsBowerPricesV3Response } from "../integrations/vendor/smsbower/smsbower.types.js";

export interface CatalogService {
  code: string;
  name: string;
}

export interface CatalogCountry {
  id: number;
  name: string;
}

export interface CatalogStock {
  service: string;
  serviceName: string;
  country: string;
  countryId: string;
  count: number;
  price: number;
  providerId: number;
}

export interface CatalogTopCountry {
  country: string;
  price: number;
  count: number;
  partnerId: string;
}

const serviceCache = new Map<string, CatalogService[]>();
const countryCache = new Map<string, CatalogCountry[]>();
const CACHE_TTL_MS = 5 * 60 * 1000;
let lastServiceFetch = 0;
let lastCountryFetch = 0;

export const smsbowerCatalogService = {
  async getServices(): Promise<CatalogService[]> {
    const cached = serviceCache.get("services");
    if (cached && Date.now() - lastServiceFetch < CACHE_TTL_MS) {
      return cached;
    }

    const response = await smsbowerClient.getServices();
    if (response.status !== "success") {
      throw new AppError("SMSBower: failed to fetch services", 502);
    }

    const services = response.services.map((s) => ({
      code: s.code,
      name: s.name,
    }));

    serviceCache.set("services", services);
    lastServiceFetch = Date.now();
    return services;
  },

  async getCountries(): Promise<CatalogCountry[]> {
    const cached = countryCache.get("countries");
    if (cached && Date.now() - lastCountryFetch < CACHE_TTL_MS) {
      return cached;
    }

    const response = await smsbowerClient.getCountries();
    const countries = response
      .filter((c) => c.id != null && c.eng != null)
      .map((c) => ({
        id: c.id,
        name: c.eng,
      }));

    countryCache.set("countries", countries);
    lastCountryFetch = Date.now();
    return countries;
  },

  async getTopCountriesByService(
    service: string
  ): Promise<CatalogTopCountry[]> {
    const response = await smsbowerClient.getTopCountriesByService(service);
    const result: CatalogTopCountry[] = [];

    for (const [country, partners] of Object.entries(response)) {
      for (const [partnerId, data] of Object.entries(partners)) {
        result.push({
          country,
          price: data.price,
          count: data.count,
          partnerId,
        });
      }
    }

    return result;
  },

  async getStock(params: {
    service?: string;
    country?: string;
  }): Promise<CatalogStock[]> {
    const service = params.service?.trim();
    const country = params.country?.trim();

    if (!service && !country) {
      throw new AppError(
        "Select a service or country to browse SMSBower stock",
        400
      );
    }

    const [response, countries, services] = await Promise.all([
      smsbowerClient.getPricesV3({ service, country }),
      this.getCountries(),
      this.getServices(),
    ]);

    const countryIdToName = new Map<string, string>();
    const countryNameToId = new Map<string, string>();
    for (const c of countries) {
      countryIdToName.set(c.id.toString(), c.name);
      countryNameToId.set(c.name, c.id.toString());
    }

    const serviceNameToCode = new Map<string, string>();
    const serviceCodeToName = new Map<string, string>();
    for (const s of services) {
      serviceNameToCode.set(s.name.toLowerCase(), s.code);
      serviceCodeToName.set(s.code.toLowerCase(), s.name);
    }

    const flattened = flattenPricesV3(response, {
      countryIdToName,
      countryNameToId,
      serviceNameToCode,
      serviceCodeToName,
    });

    const serviceCode = service
      ? serviceNameToCode.get(service.toLowerCase()) ?? service
      : undefined;
    const countryId = country
      ? countryNameToId.get(country) ?? country
      : undefined;

    return flattened.filter((item) => {
      if (serviceCode && item.service !== serviceCode) return false;
      if (countryId && item.countryId !== countryId) return false;
      return true;
    });
  },

  async getBalance(): Promise<{ balance: string; currency: string }> {
    const balance = await smsbowerClient.getBalance();
    return { balance, currency: "USD" };
  },
};

interface CountryMaps {
  countryIdToName: Map<string, string>;
  countryNameToId: Map<string, string>;
  serviceNameToCode: Map<string, string>;
  serviceCodeToName: Map<string, string>;
}

function resolveCountry(
  key: string,
  maps: CountryMaps
): { countryId: string; countryName: string } {
  if (maps.countryNameToId.has(key)) {
    return { countryId: maps.countryNameToId.get(key)!, countryName: key };
  }
  return {
    countryId: key,
    countryName: maps.countryIdToName.get(key) ?? key,
  };
}

function resolveService(
  key: string,
  maps: CountryMaps
): { serviceCode: string; serviceName: string } {
  const target = key.toLowerCase();
  const serviceCode = maps.serviceNameToCode.get(target) ?? key;
  const serviceName = maps.serviceCodeToName.get(target) ?? key;
  return { serviceCode, serviceName };
}

function flattenPricesV3(
  response: SmsBowerPricesV3Response,
  maps: CountryMaps
): CatalogStock[] {
  const result: CatalogStock[] = [];

  for (const [countryKey, services] of Object.entries(response)) {
    const { countryId, countryName } = resolveCountry(countryKey, maps);
    for (const [serviceKey, providers] of Object.entries(services)) {
      const { serviceCode, serviceName } = resolveService(serviceKey, maps);
      for (const [, provider] of Object.entries(providers)) {
        result.push({
          service: serviceCode,
          serviceName,
          country: countryName,
          countryId,
          count: provider.count,
          price: provider.price,
          providerId: provider.provider_id,
        });
      }
    }
  }

  return result;
}