import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/number.repository.js", () => ({
  numberRepository: {
    findByIdForUserWithEndpoint: vi.fn(),
    findByMessageHash: vi.fn(),
    createOtpMessage: vi.fn(),
    updateStatus: vi.fn(),
    findLatestOtpMessage: vi.fn(),
    findProductNumberByPhoneNumber: vi.fn(),
  },
}));

import { getOtpByNumber } from "../src/services/otp-proxy.service.js";
import { numberRepository } from "../src/repositories/number.repository.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

const importedNumber = {
  id: "num_1",
  userId: "user_1",
  phoneNumber: "+12025550123",
  vendorOrderId: null,
  status: "ACTIVE",
  otpCount: 0,
  product: {
    id: "prod_1",
    name: "WhatsApp OTP",
    service: "WhatsApp",
    vendorId: null,
    source: "IMPORTED",
  },
  productNumber: { providerEndpoint: "https://8.8.8.8/otp" },
};

const latestMessage = {
  id: "msg_1",
  rawMessage: "Your WhatsApp code is 894561",
  otpCode: "894561",
  receivedAt: new Date("2026-09-13T10:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValue(
    importedNumber as never
  );
  vi.mocked(numberRepository.findByMessageHash).mockResolvedValue(null);
  vi.mocked(numberRepository.createOtpMessage).mockResolvedValue(undefined);
  vi.mocked(numberRepository.updateStatus).mockResolvedValue(undefined);
  vi.mocked(numberRepository.findLatestOtpMessage).mockResolvedValue(
    latestMessage as never
  );
  vi.mocked(numberRepository.findProductNumberByPhoneNumber).mockResolvedValue(
    null
  );
});

describe("getOtpByNumber (imported product)", () => {
  it("rejects numbers that do not belong to the user", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce(
      null
    );
    await expect(getOtpByNumber("user_2", "num_1")).rejects.toThrow("Number not found");
  });

  it("rejects expired, refunded and disabled numbers", async () => {
    for (const status of ["EXPIRED", "REFUNDED", "DISABLED"]) {
      vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
        ...importedNumber,
        status,
      } as never);
      await expect(getOtpByNumber("user_1", "num_1")).rejects.toThrow(
        "no longer active"
      );
    }
  });

  it("fetches, saves and returns the OTP from the provider endpoint", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () => "Your WhatsApp code is 894561",
    } as Response);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(mockedFetch).toHaveBeenCalledWith(
      "https://8.8.8.8/otp",
      expect.objectContaining({ signal: expect.anything() })
    );
    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        purchasedNumberId: "num_1",
        otpCode: "894561",
      })
    );
    expect(numberRepository.updateStatus).toHaveBeenCalledWith("num_1", {
      status: "RECEIVED",
      otpCount: 1,
      lastCheckedAt: expect.any(Date),
    });
    expect(result).toMatchObject({
      otp: "894561",
      waiting: false,
      otpCount: 1,
      status: "RECEIVED",
    });
    expect(result.message?.rawMessage).toBe("Your WhatsApp code is 894561");
  });

  it("falls back to the inventory number by phone when the link is missing", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
      ...importedNumber,
      productNumber: null,
    } as never);
    vi.mocked(numberRepository.findProductNumberByPhoneNumber).mockResolvedValueOnce({
      id: "pn_1",
      providerEndpoint: "https://8.8.8.8/otp",
      status: "SOLD",
    } as never);
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () => "Your WhatsApp code is 894561",
    } as Response);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(numberRepository.findProductNumberByPhoneNumber).toHaveBeenCalledWith(
      "+12025550123"
    );
    expect(result.otp).toBe("894561");
    expect(result.waiting).toBe(false);
  });

  it("extracts the real OTP from a JSON provider response (SMS8 data.code)", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 0,
          msg: "succeed",
          data: { code: "894561", code_time: "2026-09-14 08:00:00" },
        }),
    } as Response);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({ otpCode: "894561" })
    );
    expect(result.otp).toBe("894561");
    expect(result.waiting).toBe(false);
  });

  it("does not concatenate extra digits from a code field with surrounding text", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 0,
          msg: "succeed",
          data: {
            code: "Your verification code is 87190, ID 294",
            code_time: "2026-09-14 08:00:00",
          },
        }),
    } as Response);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(numberRepository.createOtpMessage).toHaveBeenCalledWith(
      expect.objectContaining({ otpCode: "87190" })
    );
    expect(numberRepository.createOtpMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ otpCode: "87190294" })
    );
  });

  it("does not read a wrong code from JSON dates when the provider has no code yet", async () => {
    vi.mocked(numberRepository.findLatestOtpMessage).mockResolvedValueOnce(null);
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          code: 0,
          msg: "No verification code",
          data: {
            code: "",
            code_time: "",
            expired_date: "2026-11-24 00:00:00",
          },
        }),
    } as Response);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(numberRepository.createOtpMessage).not.toHaveBeenCalled();
    expect(result.otp).toBeNull();
    expect(result.waiting).toBe(true);
  });

  it("returns waiting state when the provider has no message yet", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () => "",
    } as Response);
    vi.mocked(numberRepository.findLatestOtpMessage).mockResolvedValueOnce(null);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(result.waiting).toBe(true);
    expect(result.otp).toBeNull();
    expect(numberRepository.createOtpMessage).not.toHaveBeenCalled();
  });

  it("does not duplicate an already-saved message", async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      text: async () => "Your WhatsApp code is 894561",
    } as Response);
    vi.mocked(numberRepository.findByMessageHash).mockResolvedValueOnce({
      id: "msg_0",
    } as never);

    const result = await getOtpByNumber("user_1", "num_1");

    expect(numberRepository.createOtpMessage).not.toHaveBeenCalled();
    expect(result.otpCount).toBe(0);
  });

  it("surfaces provider errors", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(getOtpByNumber("user_1", "num_1")).rejects.toThrow(
      "Provider returned an error"
    );
  });

  it("rejects provider endpoints that fail SSRF checks", async () => {
    vi.mocked(numberRepository.findByIdForUserWithEndpoint).mockResolvedValueOnce({
      ...importedNumber,
      productNumber: { providerEndpoint: "https://169.254.169.254/latest" },
    } as never);

    await expect(getOtpByNumber("user_1", "num_1")).rejects.toThrow("private address");
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});