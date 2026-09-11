import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import {
  SMSBOWER_ERRORS,
  type SmsBowerCountryResponse,
  type SmsBowerPricesV3Response,
  type SmsBowerServiceResponse,
  type SmsBowerTopCountriesResponse,
} from "./smsbower.types.js";

const BASE_URL = `${env.smsbowerBaseUrl
  .replace(/\/+$/, "")
  .replace(/\/stubs$/, "")}/stubs/handler_api.php`;
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;
const SERVICES_CACHE_TTL_MS = 5 * 60 * 1000;

function truncateText(text: string, maxLength = 200): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

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
      throw new AppError(`SMSBower API error: ${truncateText(text)}`, 502);
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
  throw new AppError(`SMSBower error: ${truncateText(text)}`, 502);
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