export interface SmsBowerNumberResponse {
  activationId: string | number;
  phoneNumber: string | number;
  activationCost: string | number;
  countryCode: string | number;
  canGetAnotherSms: boolean | string | number | null;
  activationTime: string;
  activationOperator: string | null;
}

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

export interface SmsBowerPricesResponse {
  [country: string]: {
    [service: string]: {
      cost: number;
      count: number;
    };
  };
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

export interface SmsBowerWalletResponse {
  wallet_address: string;
}

export const SMSBOWER_STATUS = {
  WAIT_CODE: "STATUS_WAIT_CODE",
  WAIT_RETRY: "STATUS_WAIT_RETRY",
  CANCEL: "STATUS_CANCEL",
  OK: "STATUS_OK",
  READY: "ACCESS_READY",
  RETRY_GET: "ACCESS_RETRY_GET",
  ACTIVATION: "ACCESS_ACTIVATION",
  CANCEL_ACCESS: "ACCESS_CANCEL",
  BALANCE: "ACCESS_BALANCE",
  NUMBER: "ACCESS_NUMBER",
} as const;

export const SMSBOWER_ACTION = {
  READY: 1,
  RETRY: 3,
  COMPLETE: 6,
  CANCEL: 8,
} as const;

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
} as const;
