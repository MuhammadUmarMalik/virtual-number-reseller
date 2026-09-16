import { env } from "../../../config/env.js";
import { AppError } from "../../../utils/app-error.js";
import {
  SMSBOWER_ERRORS,
  SMSBOWER_STATUSES,
  type SmsBowerActivation,
  type SmsBowerCountryResponse,
  type SmsBowerPricesV3Response,
  type SmsBowerServiceResponse,
  type SmsBowerSetStatusResult,
  type SmsBowerStatus,
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

export function parseActivation(text: string): SmsBowerActivation {
  const cleaned = text.replace(/\s+/g, "");
  // SMSBower may return ACCESS_NUMBER or ACCESS_ACTIVATION — both carry ID:NUMBER.
  const match = cleaned.match(/^ACCESS_(?:NUMBER|ACTIVATION):(\d+):(.+)$/);
  if (!match) {
    throw new AppError(
      `SMSBower: unexpected getNumber response "${truncateText(text)}"`,
      502
    );
  }
  return { activationId: match[1]!, phoneNumber: match[2]!.trim() };
}

/** Maps a raw getStatus response line into a typed status. */
export function parseActivationStatus(text: string): SmsBowerStatus {
  const trimmed = text.trim();

  if (trimmed.startsWith(SMSBOWER_STATUSES.OK)) {
    const code = trimmed.slice(SMSBOWER_STATUSES.OK.length + 1).trim();
    return { status: SMSBOWER_STATUSES.OK, code: code || null, message: null };
  }
  if (trimmed === SMSBOWER_STATUSES.WAIT_CODE) {
    return { status: SMSBOWER_STATUSES.WAIT_CODE, code: null, message: null };
  }
  if (trimmed === SMSBOWER_STATUSES.WAIT_RETRY) {
    return { status: SMSBOWER_STATUSES.WAIT_RETRY, code: null, message: null };
  }
  if (trimmed === SMSBOWER_STATUSES.CANCEL) {
    return { status: SMSBOWER_STATUSES.CANCEL, code: null, message: null };
  }
  if (trimmed === SMSBOWER_STATUSES.WAIT_RESEND) {
    return { status: SMSBOWER_STATUSES.WAIT_RESEND, code: null, message: null };
  }
  if (trimmed.startsWith("STATUS_")) {
    const separator = trimmed.indexOf(":");
    return {
      status: "UNKNOWN",
      code: null,
      message: separator === -1 ? trimmed : trimmed.slice(separator + 1).trim(),
    };
  }
  parseError(text);
  throw new AppError(`SMSBower: unexpected getStatus response "${truncateText(text)}"`, 502);
}

/** Parses the setStatus response into a typed result. */
export function parseSetStatusResponse(text: string, statusCode: number): SmsBowerSetStatusResult {
  const trimmed = text.trim();

  if (trimmed.startsWith("ACCESS_CANCEL")) {
    return { code: "CANCEL", sms: null };
  }
  if (trimmed.startsWith("ACCESS_RETRY_GET")) {
    return { code: "RETRY_GET", sms: null };
  }
  if (trimmed.startsWith("ACCESS_READY")) {
    return { code: "READY", sms: null };
  }
  if (trimmed.startsWith("ACCESS_ACTIVATION")) {
    const sms = trimmed.slice("ACCESS_ACTIVATION".length).replace(/^:/, "").trim();
    return { code: "ACTIVATION", sms: sms || null };
  }
  if (trimmed.startsWith("ACCESS_FINISH")) {
    const sms = trimmed.slice("ACCESS_FINISH".length).replace(/^:/, "").trim();
    return { code: "FINISH", sms: sms || null };
  }
  if (statusCode === 8 && trimmed) {
    // Finish may return the code with no prefix on some builds.
    return { code: "FINISH", sms: trimmed };
  }
  parseError(text);
  throw new AppError(`SMSBower: unexpected setStatus response "${truncateText(text)}"`, 502);
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

  /** Requests a new activation: returns the activation id and phone number. */
  async getNumber(params: {
    service: string;
    country?: string;
    operator?: string;
    maxPrice?: number;
  }): Promise<SmsBowerActivation> {
    const text = ensureNoError(
      await request(BASE_URL, {
        action: "getNumber",
        service: params.service,
        country: params.country,
        operator: params.operator,
        maxPrice: params.maxPrice,
      })
    );
    return parseActivation(text);
  },

  /** Requests a new activation without country filtering (V2). */
  async getNumberV2(params: {
    service: string;
    operator?: string;
    maxPrice?: number;
  }): Promise<SmsBowerActivation> {
    const text = ensureNoError(
      await request(BASE_URL, {
        action: "getNumberV2",
        service: params.service,
        operator: params.operator,
        maxPrice: params.maxPrice,
      })
    );
    return parseActivation(text);
  },

  /** Queries the current activation status. */
  async getStatus(activationId: string): Promise<SmsBowerStatus> {
    const text = ensureNoError(
      await request(BASE_URL, { action: "getStatus", id: activationId })
    );
    return parseActivationStatus(text);
  },

  /** Changes the activation status (cancel / request another code / finish). */
  async setStatus(
    activationId: string,
    statusCode: number
  ): Promise<SmsBowerSetStatusResult> {
    const text = ensureNoError(
      await request(BASE_URL, {
        action: "setStatus",
        id: activationId,
        status: statusCode,
      })
    );
    return parseSetStatusResponse(text, statusCode);
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
  const seenIds = new Set<number>();

  const pushCountry = (
    id: number,
    fields: Pick<SmsBowerCountryResponse, "rus" | "eng" | "chn">
  ) => {
    if (seenIds.has(id)) return;
    seenIds.add(id);
    result.push({ id, ...fields });
  };

  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Record<string, unknown>;
      const id = readCountryId(record);
      const fields = readCountryFields(record);
      if (Number.isFinite(id) && fields) {
        pushCountry(id, fields);
      }
    }
    return result;
  }

  for (const [key, value] of Object.entries(parsed)) {
    const id = Number(key);
    if (typeof value === "string") {
      if (Number.isFinite(id)) {
        pushCountry(id, { rus: value, eng: value, chn: value });
      }
      continue;
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      continue;
    }
    const fields = readCountryFields(value as Record<string, unknown>);
    if (Number.isFinite(id) && fields) {
      pushCountry(id, fields);
    }
  }
  return result;
}