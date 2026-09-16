import type { CreatePaymentInput, CreatePaymentResult, VerifyCallbackInput, VerifyCallbackResult, GetPaymentStatusInput, GetPaymentStatusResult } from "../types";
import type { PaymentGatewayAdapter } from "./interface";

type MockScenario = "SUCCESS" | "FAILURE" | "CANCELLATION" | "PENDING" | "DUPLICATE" | "INVALID_SIGNATURE" | "AMOUNT_MISMATCH";

export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  private scenario: MockScenario = "SUCCESS";

  setScenario(scenario: MockScenario) {
    this.scenario = scenario;
  }

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const amountPaisa = input.amount.times(100).toFixed(0);
    const providerTransactionId = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    switch (this.scenario) {
      case "SUCCESS":
        return { redirectUrl: `https://mock-gateway.test/pay?ref=${input.merchantReference}&amount=${amountPaisa}&status=success`, providerTransactionId };
      case "FAILURE":
        return { redirectUrl: `https://mock-gateway.test/pay?ref=${input.merchantReference}&amount=${amountPaisa}&status=failed`, providerTransactionId };
      case "CANCELLATION":
        return { redirectUrl: `https://mock-gateway.test/pay?ref=${input.merchantReference}&amount=${amountPaisa}&status=cancelled`, providerTransactionId };
      case "PENDING":
        return { redirectUrl: `https://mock-gateway.test/pay?ref=${input.merchantReference}&amount=${amountPaisa}&status=pending`, providerTransactionId };
      default:
        return { redirectUrl: `https://mock-gateway.test/pay?ref=${input.merchantReference}&amount=${amountPaisa}&status=success`, providerTransactionId };
    }
  }

  async verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult> {
    const body = input.rawBody;
    const mockStatus = (body._mockStatus as MockScenario) ?? this.scenario;

    switch (mockStatus) {
      case "INVALID_SIGNATURE":
        return { verified: false, normalizedStatus: "FAILED", providerTransactionId: undefined, paidAmount: undefined, providerResponseCode: undefined, providerResponseMessage: undefined, rawData: undefined };
      case "AMOUNT_MISMATCH":
        return {
          verified: true, normalizedStatus: "FAILED",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: "0",
          providerResponseCode: "AMOUNT_MISMATCH",
          providerResponseMessage: "Amount mismatch",
          rawData: body as Record<string, unknown>,
        };
      case "SUCCESS":
        return {
          verified: true, normalizedStatus: "SUCCESS",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: input.expectedAmount,
          providerResponseCode: "000",
          providerResponseMessage: "Successful",
          rawData: body as Record<string, unknown>,
        };
      case "FAILURE":
        return {
          verified: true, normalizedStatus: "FAILED",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: "0",
          providerResponseCode: "FAILED",
          providerResponseMessage: "Payment failed",
          rawData: body as Record<string, unknown>,
        };
      case "CANCELLATION":
        return {
          verified: true, normalizedStatus: "CANCELLED",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: "0",
          providerResponseCode: "CANCELLED",
          providerResponseMessage: "Cancelled by user",
          rawData: body as Record<string, unknown>,
        };
      case "PENDING":
        return {
          verified: true, normalizedStatus: "PENDING",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: "0",
          providerResponseCode: "PENDING",
          providerResponseMessage: "Pending",
          rawData: body as Record<string, unknown>,
        };
      default:
        return {
          verified: true, normalizedStatus: "SUCCESS",
          providerTransactionId: `MOCK-${Date.now()}`,
          paidAmount: input.expectedAmount,
          providerResponseCode: "000",
          providerResponseMessage: "Successful",
          rawData: body as Record<string, unknown>,
        };
    }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult> {
    return { normalizedStatus: "PENDING", providerTransactionId: input.providerTransactionId };
  }
}
