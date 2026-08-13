import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import {
  SMSBOWER_ACTION,
  SMSBOWER_ERRORS,
  type SmsBowerCountryResponse,
  type SmsBowerNumberResponse,
  type SmsBowerPricesResponse,
  type SmsBowerPricesV3Response,
  type SmsBowerServiceResponse,
  type SmsBowerTopCountriesResponse,
  type SmsBowerWalletResponse,
} from "./smsbower.types.js";

const BASE_URL = "https://smsbower.page/stubs/handler_api.php";
const WALLET_URL = "https://smsbower.page/api/payment/getActualWalletAddress";
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const SERVICES_CACHE_TTL_MS = 5 * 60 * 1000;

let servicesCache: SmsBowerServiceResponse | null = null;
let servicesCacheAt = 0;

function isRetryable(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof DOMException ||
    (error instanceof Error && "cause" in error)
  );
}

async function request(
  url: string,
  params: Record<string, string | number | undefined>
): Promise<string> {
  const searchParams = new URLSearchParams();
  searchParams.set("api_key", env.smsbowerApiKey);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const fullUrl = `${url}?${searchParams.toString()}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * 2 ** (attempt - 1))
      );
    }

    let response: Response;
    try {
      response = await fetch(fullUrl, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_RETRIES) break;
      continue;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new AppError(`SMSBower API error: ${text}`, 502);
    }
    return text;
  }

  const cause =
    lastError instanceof Error
      ? `${lastError.name}: ${lastError.message}`
      : String(lastError);
  throw new AppError(`SMSBower API is unreachable (${cause})`, 502);
}

function parseError(text: string): never {
  if (text === SMSBOWER_ERRORS.BAD_KEY) {
    throw new AppError("SMSBower API key is invalid", 401);
  }
  if (text === SMSBOWER_ERRORS.BAD_ACTION) {
    throw new AppError("SMSBower: invalid action", 400);
  }
  if (text === SMSBOWER_ERRORS.BAD_SERVICE || text === SMSBOWER_ERRORS.WRONG_SERVICE) {
    throw new AppError("SMSBower: invalid service", 400);
  }
  if (text === SMSBOWER_ERRORS.BAD_COUNTRY) {
    throw new AppError("SMSBower: invalid country", 400);
  }
  if (text === SMSBOWER_ERRORS.NO_ACTIVATION) {
    throw new AppError("SMSBower: activation not found", 404);
  }
  if (text === SMSBOWER_ERRORS.NO_NUMBERS) {
    throw new AppError("SMSBower: no numbers available for this service/country", 400);
  }
  if (text === SMSBOWER_ERRORS.NO_BALANCE) {
    throw new AppError("SMSBower: insufficient balance", 402);
  }
  if (text === SMSBOWER_ERRORS.BAD_STATUS) {
    throw new AppError("SMSBower: invalid status", 400);
  }
  if (text === SMSBOWER_ERRORS.EARLY_CANCEL_DENIED) {
    throw new AppError(
      "SMSBower: cancellation not allowed yet (wait 2 minutes)",
      400
    );
  }
  throw new AppError(`SMSBower error: ${text}`, 502);
}

function ensureNoError(text: string): string {
  if (
    text.startsWith("BAD_") ||
    text.startsWith("NO_") ||
    text === SMSBOWER_ERRORS.WRONG_SERVICE ||
    text === SMSBOWER_ERRORS.EARLY_CANCEL_DENIED
  ) {
    parseError(text);
  }
  return text;
}

export const smsbowerClient = {
  async getBalance(): Promise<string> {
    const text = ensureNoError(await request(BASE_URL, { action: "getBalance" }));
    if (!text.startsWith("ACCESS_BALANCE:")) {
      throw new AppError(`SMSBower: unexpected balance response: ${text}`, 502);
    }
    return text.replace("ACCESS_BALANCE:", "");
  },

  async getNumber(params: {
    service: string;
    country: string;
    maxPrice?: string;
    minPrice?: string;
    providerIds?: string;
    exceptProviderIds?: string;
  }): Promise<{ activationId: string; phoneNumber: string }> {
    const text = ensureNoError(
      await request(BASE_URL, {
        action: "getNumber",
        service: params.service,
        country: params.country,
        maxPrice: params.maxPrice,
        minPrice: params.minPrice,
        providerIds: params.providerIds,
        exceptProviderIds: params.exceptProviderIds,
      })
    );
    if (!text.startsWith("ACCESS_NUMBER:")) {
      throw new AppError(`SMSBower: unexpected getNumber response: ${text}`, 502);
    }
    const parts = text.replace("ACCESS_NUMBER:", "").split(":");
    return { activationId: parts[0], phoneNumber: parts[1] };
  },

  async getNumberV2(params: {
    service: string;
    country: string;
    maxPrice?: string;
    minPrice?: string;
    providerIds?: string;
    exceptProviderIds?: string;
  }): Promise<SmsBowerNumberResponse> {
    const text = ensureNoError(
      await request(BASE_URL, {
        action: "getNumberV2",
        service: params.service,
        country: params.country,
        maxPrice: params.maxPrice,
        minPrice: params.minPrice,
        providerIds: params.providerIds,
        exceptProviderIds: params.exceptProviderIds,
      })
    );
    try {
      return JSON.parse(text) as SmsBowerNumberResponse;
    } catch {
      throw new AppError(`SMSBower: invalid getNumberV2 response: ${text}`, 502);
    }
  },

  async getStatus(activationId: string): Promise<string> {
    const text = ensureNoError(
      await request(BASE_URL, { action: "getStatus", id: activationId })
    );
    return text;
  },

  async setStatus(activationId: string, status: number): Promise<string> {
    const text = ensureNoError(
      await request(BASE_URL, { action: "setStatus", id: activationId, status })
    );
    return text;
  },

  async getPrices(params: {
    service?: string;
    country?: string;
  }): Promise<SmsBowerPricesResponse> {
    const text = await request(BASE_URL, {
      action: "getPrices",
      service: params.service,
      country: params.country,
    });
    try {
      return JSON.parse(text) as SmsBowerPricesResponse;
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid getPrices response: ${text}`, 502);
    }
  },

  async getServices(): Promise<SmsBowerServiceResponse> {
    if (servicesCache && Date.now() - servicesCacheAt < SERVICES_CACHE_TTL_MS) {
      return servicesCache;
    }
    const text = await request(BASE_URL, { action: "getServicesList" });
    try {
      const parsed = JSON.parse(text) as SmsBowerServiceResponse;
      servicesCache = parsed;
      servicesCacheAt = Date.now();
      return parsed;
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid getServicesList response: ${text}`, 502);
    }
  },

  async resolveServiceCode(service: string): Promise<string> {
    const value = service?.trim();
    if (!value) return value;

    const target = value.toLowerCase();
    const cached = await this.getServices();
    for (const s of cached.services) {
      if (s.code.toLowerCase() === target) return s.code;
    }
    for (const s of cached.services) {
      if (s.name.toLowerCase() === target) return s.code;
    }
    return value;
  },

  async getCountries(): Promise<SmsBowerCountryResponse[]> {
    const text = await request(BASE_URL, { action: "getCountries" });
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid getCountries response: ${text}`, 502);
    }
    return normalizeCountries(parsed);
  },

  async getTopCountriesByService(
    service: string
  ): Promise<SmsBowerTopCountriesResponse> {
    const text = await request(BASE_URL, {
      action: "getTopCountriesByService",
      service,
    });
    try {
      return JSON.parse(text) as SmsBowerTopCountriesResponse;
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid getTopCountriesByService response: ${text}`, 502);
    }
  },

  async getPricesV3(params: {
    service?: string;
    country?: string;
  }): Promise<SmsBowerPricesV3Response> {
    const text = await request(BASE_URL, {
      action: "getPricesV3",
      service: params.service,
      country: params.country,
    });
    try {
      return JSON.parse(text) as SmsBowerPricesV3Response;
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid getPricesV3 response: ${text}`, 502);
    }
  },

  async getActualWalletAddress(params: {
    coin: string;
    network: string;
  }): Promise<SmsBowerWalletResponse> {
    const text = await request(WALLET_URL, {
      coin: params.coin,
      network: params.network,
    });
    try {
      return JSON.parse(text) as SmsBowerWalletResponse;
    } catch {
      parseError(text);
      throw new AppError(`SMSBower: invalid wallet response: ${text}`, 502);
    }
  },

  SMSBOWER_ACTION,
};

function readCountryFields(
  record: Record<string, unknown>
): Pick<SmsBowerCountryResponse, "rus" | "eng" | "chn"> | null {
  const eng =
    typeof record.eng === "string"
      ? record.eng
      : typeof record.name === "string"
        ? record.name
        : "";
  if (!eng) return null;
  const rus = typeof record.rus === "string" ? record.rus : eng;
  const chn = typeof record.chn === "string" ? record.chn : eng;
  return { rus, eng, chn };
}

function readCountryId(record: Record<string, unknown>): number {
  if (typeof record.id === "number") return record.id;
  if (typeof record.id === "string") return Number(record.id);
  return Number.NaN;
}

export function normalizeCountries(parsed: unknown): SmsBowerCountryResponse[] {
  if (!parsed || typeof parsed !== "object") return [];

  const result: SmsBowerCountryResponse[] = [];

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Record<string, unknown>;
      const id = readCountryId(record);
      const fields = readCountryFields(record);
      if (Number.isFinite(id) && fields) {
        result.push({ id, ...fields });
      }
    }
    return result;
  }

  for (const [key, value] of Object.entries(parsed)) {
    const id = Number(key);
    if (typeof value === "string") {
      if (Number.isFinite(id)) {
        result.push({ id, rus: value, eng: value, chn: value });
      }
      continue;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue;
    }
    const fields = readCountryFields(value as Record<string, unknown>);
    if (Number.isFinite(id) && fields) {
      result.push({ id, ...fields });
    }
  }
  return result;
}
