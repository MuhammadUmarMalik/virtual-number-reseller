import { otpRepository, type OtpHistoryParams } from "../repositories/otp.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";

function serializeMessage(message: {
  receivedAt: Date;
  createdAt: Date;
  purchasedNumber?: unknown;
} & Record<string, unknown>) {
  return {
    ...message,
    receivedAt: message.receivedAt.toISOString(),
    createdAt: message.createdAt.toISOString(),
  };
}

export const otpService = {
  async listHistory(params: OtpHistoryParams) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      otpRepository.count(params),
      otpRepository.list(params),
    ]);

    return buildPagination(items.map(serializeMessage), total, { page, limit });
  },

  async getOtp(otpId: string, userId?: string) {
    const message = await otpRepository.findById(otpId, userId);
    if (!message) {
      throw new AppError("OTP message not found", 404);
    }
    return serializeMessage(message);
  },
};
