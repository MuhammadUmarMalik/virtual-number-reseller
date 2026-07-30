import type { PaymentProvider, PaymentStatus } from "@number-reseller/types";

export interface CreatePaymentInput {
  userId: string;
  amount: string;
  currency: "PKR";
  merchantReference: string;
  callbackUrl: string;
}

export interface CreatePaymentResult {
  provider: PaymentProvider;
  merchantReference: string;
  redirectUrl: string;
  signedPayload: Record<string, string>;
}

export interface VerifyCallbackInput {
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown>;
}

export interface VerifyCallbackResult {
  verified: boolean;
  merchantReference: string | null;
  providerTransactionId: string | null;
  amount: string | null;
  status: PaymentStatus;
  redactedPayload: Record<string, unknown>;
}

export interface PaymentStatusInput {
  merchantReference: string;
}

export interface PaymentStatusResult {
  status: PaymentStatus;
  providerTransactionId: string | null;
}

export interface RefundPaymentInput {
  providerTransactionId: string;
  amount: string;
  reason: string;
}

export interface RefundPaymentResult {
  status: PaymentStatus;
  providerRefundId: string | null;
}

export interface PaymentGatewayAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult>;
  getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult>;
  refundPayment?(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}

export abstract class MerchantGatewayAdapter implements PaymentGatewayAdapter {
  protected constructor(public readonly provider: PaymentProvider) {}

  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  abstract verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult>;
  abstract getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult>;
}

export class JazzCashPaymentAdapter extends MerchantGatewayAdapter {
  constructor() {
    super("JAZZCASH");
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: this.provider,
      merchantReference: input.merchantReference,
      redirectUrl: "about:blank",
      signedPayload: {
        merchantReference: input.merchantReference,
        amount: input.amount,
        callbackUrl: input.callbackUrl
      }
    };
  }

  async verifyCallback(): Promise<VerifyCallbackResult> {
    throw new Error("JazzCash callback verification requires merchant documentation and secrets");
  }

  async getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult> {
    return { status: "PENDING", providerTransactionId: input.merchantReference };
  }
}

export class EasypaisaPaymentAdapter extends MerchantGatewayAdapter {
  constructor() {
    super("EASYPAISA");
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: this.provider,
      merchantReference: input.merchantReference,
      redirectUrl: "about:blank",
      signedPayload: {
        merchantReference: input.merchantReference,
        amount: input.amount,
        callbackUrl: input.callbackUrl
      }
    };
  }

  async verifyCallback(): Promise<VerifyCallbackResult> {
    throw new Error("Easypaisa callback verification requires merchant documentation and secrets");
  }

  async getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult> {
    return { status: "PENDING", providerTransactionId: input.merchantReference };
  }
}

export class MockPaymentGatewayAdapter extends MerchantGatewayAdapter {
  constructor() {
    super("MOCK");
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      provider: this.provider,
      merchantReference: input.merchantReference,
      redirectUrl: `/wallet/top-up/mock?reference=${encodeURIComponent(input.merchantReference)}`,
      signedPayload: { merchantReference: input.merchantReference, amount: input.amount }
    };
  }

  async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
    const merchantReference =
      typeof input.body.merchantReference === "string" ? input.body.merchantReference : null;
    const amount = typeof input.body.amount === "string" ? input.body.amount : null;
    const status = input.body.status === "SUCCESS" ? "SUCCESS" : "FAILED";

    return {
      verified: input.headers["x-mock-signature"] === "valid",
      merchantReference,
      providerTransactionId:
        typeof input.body.providerTransactionId === "string"
          ? input.body.providerTransactionId
          : merchantReference,
      amount,
      status,
      redactedPayload: {
        merchantReference,
        amount,
        status
      }
    };
  }

  async getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult> {
    return { status: "PENDING", providerTransactionId: input.merchantReference };
  }
}
