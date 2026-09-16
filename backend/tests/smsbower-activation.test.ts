import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/number.repository.js", () => ({
  numberRepository: {
    findByActivationId: vi.fn(),
    findByMessageHash: vi.fn(),
    createOtpMessage: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../src/services/audit.service.js", () => ({
  createNotification: vi.fn(),
}));

import { smsbowerActivationService } from "../src/services/smsbower-activation.service.js";
import { numberRepository } from "../src/repositories/number.repository.js";
import { createNotification } from "../src/services/audit.service.js";

const activationNumber = {
  id: "num_1",
  userId: "user_1",
  phoneNumber: "+12025550123",
  product: { id: "prod_1", name: "WhatsApp OTP", service: "wa" },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(numberRepository.findByActivationId).mockResolvedValue(
    activationNumber as never
  );
  vi.mocked(numberRepository.findByMessageHash).mockResolvedValue(null);
  vi.mocked(numberRepository.createOtpMessage).mockResolvedValue(undefined);
  vi.mocked(numberRepository.update).mockResolvedValue(undefined);
  vi.mocked(createNotification).mockResolvedValue(undefined);
});

describe("smsbowerActivationService.processWebhook", () => {
  it("throws for an unknown activation id", async () => {
    vi.mocked(numberRepository.findByActivationId).mockResolvedValueOnce(null);
    await expect(
      smsbowerActivationService.processWebhook({
        activationId: "missing",
        text: "code 1234",
      })
    ).rejects.toThrow("Activation not found");
  });

  it("saves the OTP and completes the number", async () => {
    const result = await smsbowerActivationService.processWebhook({
      activationId: "555",
      service: "wa",
      text: "Your WhatsApp code is 894561",
      country: "US",
    });

    expect(result).toEqual({ saved: true });
    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        purchasedNumberId: "num_1",
        otpCode: "894561",
        messageHash: expect.any(String),
      })
    );
    expect(numberRepository.update).toHaveBeenCalledWith("num_1", {
      status: "RECEIVED",
      activationStatus: "STATUS_OK",
      activationCompletedAt: expect.any(Date),
      lastCheckedAt: expect.any(Date),
    });
    expect(createNotification).toHaveBeenCalled();
  });

  it("prefers the explicit code and honors receivedAt", async () => {
    const receivedAt = "2026-09-13T10:00:00Z";
    const result = await smsbowerActivationService.processWebhook({
      activationId: "555",
      text: "code: 000000",
      code: "111222",
      receivedAt,
    });

    expect(result.saved).toBe(true);
    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        otpCode: "111222",
        receivedAt: new Date(receivedAt),
      })
    );
  });

  it("does not save the same message twice", async () => {
    vi.mocked(numberRepository.findByMessageHash).mockResolvedValueOnce({
      id: "msg_1",
    } as never);

    const result = await smsbowerActivationService.processWebhook({
      activationId: "555",
      text: "Your code is 4466",
    });

    expect(result).toEqual({ saved: false, reason: "duplicate" });
    expect(numberRepository.createOtpMessage).not.toHaveBeenCalled();
    expect(numberRepository.update).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("keeps the OTP code when the message has no parseable code", async () => {
    const result = await smsbowerActivationService.processWebhook({
      activationId: "555",
      text: "Your code is 987654",
    });

    expect(result.saved).toBe(true);
    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({ otpCode: "987654" })
    );
  });
});