import { createHash } from "node:crypto";
import type { CreatePaymentInput, CreatePaymentResult, VerifyCallbackInput, VerifyCallbackResult, GetPaymentStatusInput, GetPaymentStatusResult, NormalizedPaymentStatus, PaymentAdapterConfig } from "../types";
import type { PaymentGatewayAdapter } from "./interface";

export class JazzCashPaymentAdapter implements PaymentGatewayAdapter {
  private readonly merchantId: string;
  private readonly password: string;
  private readonly integritySalt: string;
  private readonly callbackUrl: string;

  constructor(config: PaymentAdapterConfig) {
    this.merchantId = config.merchantId!;
    this.password = config.password!;
    this.integritySalt = config.integritySalt!;
    this.callbackUrl = config.callbackUrl!;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const amountPaisa = input.amount.times(100).toFixed(0);
    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: this.merchantId,
      pp_Password: this.password,
      pp_ReturnURL: this.callbackUrl,
      pp_TxnRefNo: input.merchantReference,
      pp_Amount: amountPaisa,
      pp_TxnCurrency: "PKR",
      pp_BillReference: input.merchantReference,
      pp_Description: "Wallet Top-Up",
      ppmpf_1: "1",
      ppmpf_2: "2",
      ppmpf_3: "3",
      ppmpf_4: "4",
      ppmpf_5: "5",
    };

    const hash = this.computeHash(fields);
    fields.pp_SecureHash = hash;

    return { formFields: fields };
  }

  async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
    const body = input.rawBody;
    const pp_SecureHash = body.pp_SecureHash as string | undefined;
    const pp_ResponseCode = body.pp_ResponseCode as string | undefined;
    const pp_TransactionReference = body.pp_TransactionReference as string | undefined;
    const pp_Amount = body.pp_Amount as string | undefined;
    const pp_ResponseMessage = body.pp_ResponseMessage as string | undefined;

    if (!pp_SecureHash || !pp_ResponseCode) {
      return { verified: false, normalizedStatus: "FAILED", providerTransactionId: undefined, paidAmount: undefined, providerResponseCode: undefined, providerResponseMessage: undefined, rawData: undefined };
    }

    const computedHash = this.computeCallbackHash(body as Record<string, string>);

    if (computedHash !== pp_SecureHash) {
      return { verified: false, normalizedStatus: "FAILED", providerTransactionId: undefined, paidAmount: undefined, providerResponseCode: undefined, providerResponseMessage: undefined, rawData: undefined };
    }

    if (pp_Amount && pp_Amount !== input.expectedAmount) {
      return {
        verified: true,
        normalizedStatus: "FAILED",
        providerTransactionId: pp_TransactionReference,
        paidAmount: pp_Amount,
        providerResponseCode: pp_ResponseCode,
        providerResponseMessage: "Amount mismatch",
        rawData: { pp_SecureHash, pp_ResponseCode, pp_TransactionReference, pp_Amount, pp_ResponseMessage },
      };
    }

    const normalizedStatus = this.normalizeStatus(pp_ResponseCode);

    return {
      verified: true,
      normalizedStatus,
      providerTransactionId: pp_TransactionReference,
      paidAmount: pp_Amount,
      providerResponseCode: pp_ResponseCode,
      providerResponseMessage: pp_ResponseMessage,
      rawData: { pp_SecureHash, pp_ResponseCode, pp_TransactionReference, pp_Amount, pp_ResponseMessage },
    };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    return { normalizedStatus: "PENDING", providerTransactionId: input.providerTransactionId };
  }

  private computeHash(fields: Record<string, string>): string {
    const keys = Object.keys(fields).sort();
    const sorted = keys.map((k) => fields[k]).join("&");
    return createHash("sha256").update(this.integritySalt + "&" + sorted).digest("hex");
  }

  private computeCallbackHash(fields: Record<string, string>): string {
    const allowed = [
      "pp_Amount", "pp_BillReference", "pp_Description", "pp_Language",
      "pp_MerchantID", "pp_Password", "pp_ReturnURL", "pp_TxnCurrency",
      "pp_TxnRefNo", "pp_TxnType", "pp_Version", "ppmpf_1", "ppmpf_2",
      "ppmpf_3", "ppmpf_4", "ppmpf_5",
    ];
    const sorted = allowed
      .filter((k) => fields[k] !== undefined)
      .sort()
      .map((k) => fields[k]!)
      .join("&");
    return createHash("sha256").update(this.integritySalt + "&" + sorted).digest("hex");
  }

  private normalizeStatus(responseCode: string): NormalizedPaymentStatus {
    if (responseCode === "000") return "SUCCESS";
    if (responseCode === "103" || responseCode === "104") return "CANCELLED";
    return "FAILED";
  }
}
