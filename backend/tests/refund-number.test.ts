import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/number.repository.js", () => ({
  numberRepository: {
    findByIdForUserWithEndpoint: vi.fn(),
    hasOtpCode: vi.fn(),
  },
}));

vi.mock("../src/repositories/refund.repository.js", () => ({
  refundRepository: {
    findByOrderId: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../src/repositories/order.repository.js", () => ({
  orderRepository: { findById: vi.fn() },
}));

vi.mock("../src/services/audit.service.js", () => ({
  createAuditLog: vi.fn(),
  createNotification: vi.fn(),
}));

import { refundService } from "../src/services/refund.service.js";
import { numberRepository } from "../src/repositories/number.repository.js";
import { refundRepository } from "../src/repositories/refund.repository.js";
import { orderRepository } from "../src/repositories/order.repository.js";
import { createNotification } from "../src/services/audit.service.js";

const importedNumber = {
  id: "num_1",
  userId: "user_1",
  orderId: "ord_1",
  phoneNumber: "+12025550123",
  status: "ACTIVE",
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  product: { id: "prod_1", source: "IMPORTED" },
};

const order = {
  id: "ord_1",
  userId: "user_1",
  orderCode: "ORD-A1B2",
  total: { toString: () => "560.00" },
};

const createdRefund = {
  id: "ref_1",
  userId: "user_1",
  orderId: "ord_1",
  reason: "No OTP received for imported number +12025550123",
  status: "PENDING",
  amount: { toString: () => "560.00" },
  reviewedAt: null,
  createdAt: new Date("2026-09-14T10:00:00Z"),
  updatedAt: new Date("2026-09-14T10:00:00Z"),
  order,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValue(
    importedNumber as never
  );
  vi.mocked(numberRepository.hasOtpCode).mockResolvedValue(0);
  vi.mocked(refundRepository.findByOrderId).mockResolvedValue(null);
  vi.mocked(orderRepository.findById).mockResolvedValue(order as never);
  vi.mocked(refundRepository.create).mockResolvedValue(createdRefund as never);
  vi.mocked(createNotification).mockResolvedValue(undefined);
});

describe("refundService.createNumberRefund", () => {
  it("rejects numbers that do not belong to the user", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce(
      null
    );
    await expect(refundService.createNumberRefund("user_1", "num_1")).rejects.toThrow(
      "Number not found"
    );
  });

  it("rejects numbers that are already refunded, disabled or cancelled", async () => {
    for (const status of ["REFUNDED", "DISABLED", "CANCELLED"]) {
      vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
        ...importedNumber,
        status,
      } as never);
      await expect(
        refundService.createNumberRefund("user_1", "num_1")
      ).rejects.toThrow("cannot be refunded");
    }
  });

  it("rejects numbers outside the refund window", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
      ...importedNumber,
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(
      refundService.createNumberRefund("user_1", "num_1")
    ).rejects.toThrow("expired");
  });

  it("rejects numbers from vendor-sourced products", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
      ...importedNumber,
      product: { id: "prod_1", source: "VENDOR" },
    } as never);
    await expect(
      refundService.createNumberRefund("user_1", "num_1")
    ).rejects.toThrow("Only imported numbers");
  });

  it("rejects when an OTP was already received", async () => {
    vi.mocked(numberRepository.hasOtpCode).mockResolvedValueOnce(1);
    await expect(
      refundService.createNumberRefund("user_1", "num_1")
    ).rejects.toThrow("already received an OTP");
  });

  it("rejects duplicates when a refund was already requested", async () => {
    vi.mocked(refundRepository.findByOrderId).mockResolvedValueOnce({
      status: "PENDING",
    } as never);
    await expect(
      refundService.createNumberRefund("user_1", "num_1")
    ).rejects.toThrow("already pending");
  });

  it("creates a refund request for an imported number without an OTP", async () => {
    const result = await refundService.createNumberRefund("user_1", "num_1");

    expect(numberRepository.hasOtpCode).toHaveBeenCalledWith("num_1");
    expect(refundRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        orderId: "ord_1",
        amount: order.total,
        reason: expect.stringContaining("+12025550123"),
      })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "user_1",
        type: "REFUND",
        message: expect.stringContaining("+12025550123"),
      })
    );
    expect(result).toMatchObject({
      id: "ref_1",
      amount: "560.00",
      status: "PENDING",
    });
  });
});