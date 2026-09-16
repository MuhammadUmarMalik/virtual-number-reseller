import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findByIdForUser: vi.fn(),
  updateStatus: vi.fn(),
  resolveVendor: vi.fn(),
}));

vi.mock("../repositories/number.repository.js", () => ({
  numberRepository: {
    findByIdForUser: mocks.findByIdForUser,
    updateStatus: mocks.updateStatus,
  },
}));

vi.mock("../integrations/vendor/vendor.factory.js", () => ({
  resolveVendor: mocks.resolveVendor,
}));

import { numberService } from "./number.service.js";

function createNumber(overrides: Record<string, unknown> = {}) {
  return {
    id: "num1",
    userId: "u1",
    orderId: "ord1",
    orderItemId: "item1",
    productId: "prod1",
    vendor: "SMSBOWER",
    vendorId: "pid1",
    phoneNumber: "+15551234567",
    vendorOrderId: "ord-1",
    vendorActivationId: "act-1",
    vendorCost: null,
    vendorOperator: null,
    canGetAnotherSms: true,
    status: "ACTIVE",
    otpCount: 0,
    pollAttempts: 0,
    purchasedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    lastCheckedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("numberService.requestAnotherSms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveVendor.mockReturnValue({
      requestAnotherSms: vi.fn().mockResolvedValue({
        success: true,
        message: "Waiting for another SMS",
      }),
      completeActivation: vi.fn(),
    });
  });

  it("throws 404 when the number is not found", async () => {
    mocks.findByIdForUser.mockResolvedValue(null);

    await expect(
      numberService.requestAnotherSms("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("throws 400 when the number is in a terminal state", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber({ status: "EXPIRED" }));

    await expect(
      numberService.requestAnotherSms("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when the number is expired", async () => {
    mocks.findByIdForUser.mockResolvedValue(
      createNumber({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(
      numberService.requestAnotherSms("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when the vendor does not support another SMS", async () => {
    mocks.findByIdForUser.mockResolvedValue(
      createNumber({ canGetAnotherSms: false })
    );

    await expect(
      numberService.requestAnotherSms("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("calls vendor and resets the status to WAITING on success", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber());

    const result = await numberService.requestAnotherSms("u1", "num1");

    expect(mocks.resolveVendor).toHaveBeenCalledWith("SMSBOWER");
    expect(mocks.resolveVendor().requestAnotherSms).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorActivationId: "act-1",
        phoneNumber: "+15551234567",
      })
    );
    expect(mocks.updateStatus).toHaveBeenCalledWith(
      "num1",
      expect.objectContaining({ status: "WAITING" })
    );
    expect(result.message).toBe("Waiting for another SMS");
  });

  it("throws 502 when the vendor request fails", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber());
    mocks.resolveVendor.mockReturnValue({
      requestAnotherSms: vi.fn().mockResolvedValue({
        success: false,
        message: "BAD_STATUS",
      }),
      completeActivation: vi.fn(),
    });

    await expect(
      numberService.requestAnotherSms("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});

describe("numberService.completeActivation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveVendor.mockReturnValue({
      requestAnotherSms: vi.fn(),
      completeActivation: vi.fn().mockResolvedValue({
        success: true,
        message: "Activation completed",
      }),
    });
  });

  it("throws 404 when the number is not found", async () => {
    mocks.findByIdForUser.mockResolvedValue(null);

    await expect(
      numberService.completeActivation("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("calls vendor and marks the number DISABLED on success", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber());

    const result = await numberService.completeActivation("u1", "num1");

    expect(mocks.resolveVendor().completeActivation).toHaveBeenCalledWith(
      expect.objectContaining({ vendorActivationId: "act-1" })
    );
    expect(mocks.updateStatus).toHaveBeenCalledWith(
      "num1",
      expect.objectContaining({ status: "DISABLED" })
    );
    expect(result.message).toBe("Activation completed");
  });

  it("throws 502 when the vendor request fails", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber());
    mocks.resolveVendor.mockReturnValue({
      requestAnotherSms: vi.fn(),
      completeActivation: vi.fn().mockResolvedValue({
        success: false,
        message: "NO_ACTIVATION",
      }),
    });

    await expect(
      numberService.completeActivation("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 502 });
  });

  it("throws 400 when the number is already disabled", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber({ status: "DISABLED" }));

    await expect(
      numberService.completeActivation("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("does not hit the vendor or update status on validation failure", async () => {
    mocks.findByIdForUser.mockResolvedValue(createNumber({ status: "REFUNDED" }));

    await expect(
      numberService.completeActivation("u1", "num1")
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mocks.resolveVendor().completeActivation).not.toHaveBeenCalled();
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });
});
