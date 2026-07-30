import type { CreatePaymentInput, CreatePaymentResult, VerifyCallbackInput, VerifyCallbackResult, GetPaymentStatusInput, GetPaymentStatusResult } from "../types";

export interface PaymentGatewayAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult>;
  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult>;
}
