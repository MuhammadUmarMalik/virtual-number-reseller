import type { PaymentProvider } from "../types";
import type { PaymentGatewayAdapter } from "./interface";
import { JazzCashPaymentAdapter } from "./jazzcash";
import { EasypaisaPaymentAdapter } from "./easypaisa";
import { MockPaymentGatewayAdapter } from "./mock";

let mockAdapter: MockPaymentGatewayAdapter | undefined;

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getPaymentAdapter(provider: PaymentProvider): PaymentGatewayAdapter {
  switch (provider) {
    case "JAZZCASH":
      return new JazzCashPaymentAdapter({
        merchantId: getEnvOrThrow("JAZZCASH_MERCHANT_ID"),
        password: getEnvOrThrow("JAZZCASH_PASSWORD"),
        integritySalt: getEnvOrThrow("JAZZCASH_INTEGRITY_SALT"),
        callbackUrl: getEnvOrThrow("JAZZCASH_CALLBACK_URL"),
      });
    case "EASYPAISA":
      return new EasypaisaPaymentAdapter({
        storeId: getEnvOrThrow("EASYPAISA_STORE_ID"),
        hashKey: getEnvOrThrow("EASYPAISA_HASH_KEY"),
        callbackUrl: getEnvOrThrow("EASYPAISA_CALLBACK_URL"),
      });
    case "MOCK":
      if (!mockAdapter) mockAdapter = new MockPaymentGatewayAdapter();
      return mockAdapter;
  }
}

export function getMockAdapter(): MockPaymentGatewayAdapter {
  const adapter = getPaymentAdapter("MOCK");
  return adapter as MockPaymentGatewayAdapter;
}
