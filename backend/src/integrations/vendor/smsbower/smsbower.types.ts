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