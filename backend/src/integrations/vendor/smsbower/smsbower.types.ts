export interface SmsBowerServiceResponse {
  status: string;
  services: Array<{
    code: string;
    name: string;
  }>;
}

export interface SmsBowerCountryResponse {
  id: number;
  rus: string;
  eng: string;
  chn: string;
}

export interface SmsBowerPricesV3Response {
  [country: string]: {
    [service: string]: {
      [provider: string]: {
        count: number;
        price: number;
        provider_id: number;
      };
    };
  };
}

export interface SmsBowerTopCountriesResponse {
  [country: string]: {
    [partnerId: string]: {
      price: number;
      count: number;
    };
  };
}

/** Parsed result of getNumber / getNumberV2 (plain-text handler API). */
export interface SmsBowerActivation {
  activationId: string;
  phoneNumber: string;
}

/** Raw statuses returned by getStatus. */
export const SMSBOWER_STATUSES = {
  WAIT_CODE: "STATUS_WAIT_CODE",
  WAIT_RETRY: "STATUS_WAIT_RETRY",
  CANCEL: "STATUS_CANCEL",
  OK: "STATUS_OK",
  WAIT_RESEND: "STATUS_WAIT_RESEND",
} as const;

export type SmsBowerStatusString =
  (typeof SMSBOWER_STATUSES)[keyof typeof SMSBOWER_STATUSES];

/** Normalized getStatus result. `code`/`message` present only for STATUS_OK. */
export interface SmsBowerStatus {
  status: SmsBowerStatusString | "UNKNOWN";
  code: string | null;
  message: string | null;
}

/** `setStatus` documented status codes. */
export const SMSBOWER_SET_STATUS = {
  CONFIRM_ACTIVATION: 1,
  CANCEL: 2,
  REQUEST_ANOTHER_CODE: 3,
  CONFIRM_SMS: 4,
  CONFIRM_AND_EXTEND: 6,
  FINISH: 8,
} as const;

/** Parsed setStatus response. `sms` present when the response carries the code. */
export interface SmsBowerSetStatusResult {
  code: "CANCEL" | "RETRY_GET" | "READY" | "ACTIVATION" | "FINISH" | "UNKNOWN";
  sms: string | null;
}

export const SMSBOWER_ERRORS = {
  BAD_KEY: "BAD_KEY",
  BAD_ACTION: "BAD_ACTION",
  BAD_SERVICE: "BAD_SERVICE",
  WRONG_SERVICE: "WRONG_SERVICE",
  BAD_COUNTRY: "BAD_COUNTRY",
  NO_ACTIVATION: "NO_ACTIVATION",
  NO_NUMBERS: "NO_NUMBERS",
  NO_BALANCE: "NO_BALANCE",
  BAD_STATUS: "BAD_STATUS",
  EARLY_CANCEL_DENIED: "EARLY_CANCEL_DENIED",
  NO_SMS: "NO_SMS",
} as const;