import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type {
  AddBlackParams,
  CountryStock,
  GetCountryPhoneNumParams,
  GetMobileCodeParams,
  GetMobileCodeResult,
  GetMobileParams,
  GetMobileResult,
  GetMsgParams,
  GetMsgResult,
  PassMobileParams,
  VendorApiResponse,
  VendorUserInfo,
} from "./vendor.types.js";

const TIMEOUT_MS = 15_000;

async function request<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<VendorApiResponse<T>> {
  const url = new URL(`${env.vendorApiUrl.replace(/\/$/, "")}/${endpoint}`);
  url.searchParams.set("name", env.vendorUsername);
  url.searchParams.set("ApiKey", env.vendorApiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new AppError("Vendor API is unreachable", 502);
  }

  let body: VendorApiResponse<T>;
  try {
    body = (await response.json()) as VendorApiResponse<T>;
  } catch {
    throw new AppError("Vendor API returned an invalid response", 502);
  }

  if (body.code === 200) {
    return body;
  }

  throw new AppError(vendorErrorMessage(body.code, body.msg), 502);
}

function vendorErrorMessage(code: number, fallback: string): string {
  const messages: Record<number, string> = {
    800: "Vendor account is blocked",
    802: "Vendor credentials are invalid",
    803: "Vendor credentials are missing",
    401: "Vendor rejected the operation",
    902: "Vendor request parameter is invalid",
    903: "Vendor country code is invalid",
    904: "Vendor project is invalid",
    905: "Vendor number is invalid",
    906: "No numbers available from the vendor",
    907: "Vendor VIP key is invalid",
    908: "SMS not received yet, try again later",
    405: "Vendor failed to receive the SMS",
    400: "Vendor system exception",
    403: "Vendor credits are insufficient",
    406: "Vendor daily new-number limit reached",
    409: "Vendor request rate limit reached",
    400101: "Vendor secret key is required",
    400102: "Vendor parameter is not open",
    400103: "Vendor secret key is invalid",
    400906: "Vendor serial parameter is invalid",
    200408: "Vendor number card limit reached",
  };
  return messages[code] ?? (fallback || "Vendor request failed");
}

export const vendorClient = {
  async getUserInfo(): Promise<VendorUserInfo> {
    const body = await request<VendorUserInfo>("getUserInfo", {});
    return body.data;
  },

  async getMobile(params: GetMobileParams): Promise<GetMobileResult> {
    const body = await request<GetMobileResult>("getMobile", { ...params });
    return body.data;
  },

  async getMobileCode(params: GetMobileCodeParams): Promise<GetMobileCodeResult> {
    const body = await request<GetMobileCodeResult>("getMobileCode", {
      ...params,
    });
    return body.data;
  },

  async getMsg(params: GetMsgParams): Promise<GetMsgResult> {
    const url = new URL(
      `${env.vendorApiUrl.replace(/\/$/, "")}/getMsg`
    );
    url.searchParams.set("name", env.vendorUsername);
    url.searchParams.set("ApiKey", env.vendorApiKey);
    url.searchParams.set("pid", String(params.pid));
    url.searchParams.set("pn", String(params.pn));
    url.searchParams.set("serial", String(params.serial));

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new AppError("Vendor API is unreachable", 502);
    }

    let body: VendorApiResponse<GetMsgResult>;
    try {
      body = (await response.json()) as VendorApiResponse<GetMsgResult>;
    } catch {
      throw new AppError("Vendor API returned an invalid response", 502);
    }

    // 405/908: SMS not ready yet - treat as empty, not an error
    if (body.code === 405 || body.code === 908) {
      return "";
    }
    // 407: messages available, refresh and retry - contains data
    if (body.code === 200 || body.code === 407) {
      return body.data ?? "";
    }

    throw new AppError(vendorErrorMessage(body.code, body.msg), 502);
  },

  async passMobile(params: PassMobileParams): Promise<void> {
    await request<never>("passMobile", { ...params });
  },

  async addBlack(params: AddBlackParams): Promise<void> {
    await request<never>("addBlack", { ...params });
  },

  async getCountryPhoneNum(
    params: GetCountryPhoneNumParams
  ): Promise<CountryStock> {
    const body = await request<CountryStock>("getCountryPhoneNum", {
      pid: params.pid,
      vip: params.vip,
    });
    return body.data ?? {};
  },
};
