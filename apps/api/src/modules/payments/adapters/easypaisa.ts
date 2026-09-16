import { createHash } from "node:crypto";
import type { CreatePaymentInput, CreatePaymentResult, VerifyCallbackInput, VerifyCallbackResult, GetPaymentStatusInput, GetPaymentStatusResult, NormalizedPaymentStatus, PaymentAdapterConfig } from "../types";
import type { PaymentGatewayAdapter } from "./interface";

export class EasypaisaPaymentAdapter implements PaymentGatewayAdapter {
  private readonly storeId: string;
  private readonly hashKey: string;
  private readonly callbackUrl: string;

  constructor(config: PaymentAdapterConfig) {
    this.storeId = config.storeId!;
    this.hashKey = config.hashKey!;
    this.callbackUrl = config.callbackUrl!;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const amountPaisa = input.amount.times(100).toFixed(0);
    const dateTime = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

    const fields: Record<string, string> = {
      storeId: this.storeId,
      amount: amountPaisa,
      transactionDateTime: dateTime,
      merchantReference: input.merchantReference,
      description: "Wallet Top-Up",
      returnUrl: this.callbackUrl,
      currency: "PKR",
      language: "EN",
    };

    const hashInput = `${this.storeId}|${input.merchantReference}|${amountPaisa}|${dateTime}|${this.hashKey}`;
    fields.hash = createHash("sha256").update(hashInput).digest("hex");

    return { formFields: fields };
  }

  async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
    const body = input.rawBody;
    const responseCode = body.responseCode as string | undefined;
    const transactionReference = body.transactionReference as string | undefined;
    const transactionId = body.transactionId as string | undefined;
    const amount = body.amount as string | undefined;
    const receivedMerchantRef = body.merchantReference as string | undefined;
    const hash = body.hash as string | undefined;
    const dateTime = body.transactionDateTime as string | undefined;

    if (!hash || !responseCode) {
      return { verified: false, normalizedStatus: "FAILED", providerTransactionId: undefined, paidAmount: undefined, providerResponseCode: undefined, providerResponseMessage: undefined, rawData: undefined };
    }

    const hashInput = `${this.storeId}|${receivedMerchantRef ?? input.merchantReference}|${amount ?? "0"}|${dateTime ?? ""}|${this.hashKey}`;
    const computedHash = createHash("sha256").update(hashInput).digest("hex");

    if (computedHash !== hash) {
      return { verified: false, normalizedStatus: "FAILED", providerTransactionId: undefined, paidAmount: undefined, providerResponseCode: undefined, providerResponseMessage: undefined, rawData: undefined };
    }

    if (!amount) {
      return { verified: true, normalizedStatus: "FAILED", providerTransactionId: transactionId, paidAmount: undefined, providerResponseCode: responseCode, providerResponseMessage: undefined, rawData: undefined };
    }

    const expectedPaisa = (parseFloat(input.expectedAmount)).toString();
    if (amount !== expectedPaisa) {
      return {
        verified: true, normalizedStatus: "FAILED",
        providerTransactionId: transactionId,
        paidAmount: amount,
        providerResponseCode: responseCode,
        providerResponseMessage: "Amount mismatch",
        rawData: { responseCode, transactionReference, transactionId, amount, merchantReference: receivedMerchantRef },
      };
    }

    const normalizedStatus = this.normalizeStatus(responseCode);

    return {
      verified: true,
      normalizedStatus,
      providerTransactionId: transactionId ?? transactionReference,
      paidAmount: amount,
      providerResponseCode: responseCode,
      providerResponseMessage: transactionReference,
      rawData: { responseCode, transactionReference, transactionId, amount, merchantReference: receivedMerchantRef },
    };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    return { normalizedStatus: "PENDING", providerTransactionId: input.providerTransactionId };
  }

  private normalizeStatus(responseCode: string): NormalizedPaymentStatus {
    if (responseCode === "0" || responseCode === "000") return "SUCCESS";
    if (responseCode === "1" || responseCode === "2" || responseCode === "3") return "CANCELLED";
    return "FAILED";
  }
}
