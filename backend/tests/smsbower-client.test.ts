import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeCountries,
  parseActivation,
  parseActivationStatus,
  parseSetStatusResponse,
  smsbowerClient,
} from "../src/integrations/vendor/smsbower/smsbower.client.js";
import { AppError } from "../src/utils/app-error.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

function mockResponse(text: string, ok = true): Response {
  return { ok, status: ok ? 200 : 502, text: async () => text } as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseActivation", () => {
  it("parses ACCESS_ACTIVATION responses", () => {
    expect(parseActivation("ACCESS_ACTIVATION:123456:+12025550123")).toEqual({
      activationId: "123456",
      phoneNumber: "+12025550123",
    });
  });

  it("normalizes spacing inside phone numbers", () => {
    expect(parseActivation("ACCESS_ACTIVATION:123:+1 202 555 0123")).toEqual({
      activationId: "123",
      phoneNumber: "+12025550123",
    });
  });

  it("rejects unexpected responses", () => {
    expect(() => parseActivation("ACCESS_BALANCE:100")).toThrow(AppError);
  });
});

describe("parseActivationStatus", () => {
  it.each(["STATUS_WAIT_CODE", "STATUS_WAIT_RETRY", "STATUS_WAIT_RESEND", "STATUS_CANCEL"])(
    "maps %s to the same status with no code",
    (status) => {
      expect(parseActivationStatus(status)).toEqual({
        status,
        code: null,
        message: null,
      });
    }
  );

  it("parses STATUS_OK with a code", () => {
    expect(parseActivationStatus("STATUS_OK:894561")).toEqual({
      status: "STATUS_OK",
      code: "894561",
      message: null,
    });
  });

  it("parses STATUS_OK without a code", () => {
    expect(parseActivationStatus("STATUS_OK")).toEqual({
      status: "STATUS_OK",
      code: null,
      message: null,
    });
  });

  it("keeps unknown STATUS_* values around but marks them", () => {
    const parsed = parseActivationStatus("STATUS_UNEXPECTED:note");
    expect(parsed.status).toBe("UNKNOWN");
    expect(parsed.message).toBe("note");
  });

  it("throws on error responses", () => {
    expect(() => parseActivationStatus("NO_ACTIVATION")).toThrow(AppError);
  });
});

describe("parseSetStatusResponse", () => {
  it("parses cancellation", () => {
    expect(parseSetStatusResponse("ACCESS_CANCEL", 2)).toEqual({
      code: "CANCEL",
      sms: null,
    });
  });

  it("parses retry requests", () => {
    expect(parseSetStatusResponse("ACCESS_RETRY_GET", 3)).toEqual({
      code: "RETRY_GET",
      sms: null,
    });
  });

  it("parses another activation/code responses", () => {
    expect(parseSetStatusResponse("ACCESS_ACTIVATION:551", 1)).toEqual({
      code: "ACTIVATION",
      sms: "551",
    });
  });

  it("parses finish responses with a code", () => {
    expect(parseSetStatusResponse("ACCESS_FINISH:4466", 8)).toEqual({
      code: "FINISH",
      sms: "4466",
    });
  });

  it("parses finish without a prefix on status 8", () => {
    expect(parseSetStatusResponse("4466", 8)).toEqual({
      code: "FINISH",
      sms: "4466",
    });
  });
});

describe("smsbowerClient error mapping", () => {
  it("maps BAD_KEY to a 401", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("BAD_KEY"));
    await expect(smsbowerClient.getBalance()).rejects.toMatchObject({
      statusCode: 401,
      message: expect.stringContaining("API key is invalid"),
    });
  });

  it("maps NO_BALANCE to a 402", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("NO_BALANCE"));
    await expect(smsbowerClient.getBalance()).rejects.toMatchObject({
      statusCode: 402,
    });
  });

  it("maps NO_NUMBERS from getNumber to a 400", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("NO_NUMBERS"));
    await expect(
      smsbowerClient.getNumber({ service: "ig", country: "1" })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("maps EARLY_CANCEL_DENIED to a 400", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("EARLY_CANCEL_DENIED"));
    await expect(smsbowerClient.setStatus("123", 2)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("surfaces HTTP failures as a 502", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("nope", false));
    await expect(smsbowerClient.getBalance()).rejects.toMatchObject({
      statusCode: 502,
    });
  });
});

describe("smsbowerClient happy paths", () => {
  it("calls getNumber with the expected handler parameters", async () => {
    mockedFetch.mockResolvedValueOnce(
      mockResponse("ACCESS_ACTIVATION:999:+12025550123")
    );
    const result = await smsbowerClient.getNumber({
      service: "wa",
      country: "233",
      operator: "beeline",
      maxPrice: 5,
    });
    expect(result).toEqual({ activationId: "999", phoneNumber: "+12025550123" });

    const url = new URL(String(mockedFetch.mock.calls[0]![0]));
    expect(url.pathname).toContain("handler_api.php");
    expect(url.searchParams.get("action")).toBe("getNumber");
    expect(url.searchParams.get("service")).toBe("wa");
    expect(url.searchParams.get("country")).toBe("233");
    expect(url.searchParams.get("operator")).toBe("beeline");
    expect(url.searchParams.get("maxPrice")).toBe("5");
    expect(url.searchParams.has("api_key")).toBe(true);
  });

  it("parses getBalance responses", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("ACCESS_BALANCE:12.50"));
    await expect(smsbowerClient.getBalance()).resolves.toBe("12.50");
  });

  it("parses getStatus responses through the handler", async () => {
    mockedFetch.mockResolvedValueOnce(mockResponse("STATUS_OK:123456"));
    await expect(smsbowerClient.getStatus("555")).resolves.toEqual({
      status: "STATUS_OK",
      code: "123456",
      message: null,
    });
  });
});

describe("normalizeCountries", () => {
  it("maps object responses keyed by country id", () => {
    expect(
      normalizeCountries({ "1": { eng: "USA" }, "7": { eng: "Russia" } })
    ).toEqual([
      { id: 1, rus: "USA", eng: "USA", chn: "USA" },
      { id: 7, rus: "Russia", eng: "Russia", chn: "Russia" },
    ]);
  });

  it("maps plain-string object values", () => {
    expect(normalizeCountries({ "1": "USA" })).toEqual([
      { id: 1, rus: "USA", eng: "USA", chn: "USA" },
    ]);
  });

  it("maps array responses with explicit id fields", () => {
    expect(
      normalizeCountries([{ id: "2", eng: "Canada" }, { id: 1, eng: "USA" }])
    ).toEqual([
      { id: 2, rus: "Canada", eng: "Canada", chn: "Canada" },
      { id: 1, rus: "USA", eng: "USA", chn: "USA" },
    ]);
  });

  it("deduplicates countries sharing the same id, keeping the first", () => {
    expect(
      normalizeCountries([
        { id: 0, eng: "Any country" },
        { id: 0, eng: "Duplicate entry" },
        { id: 1, eng: "USA" },
      ])
    ).toEqual([
      { id: 0, rus: "Any country", eng: "Any country", chn: "Any country" },
      { id: 1, rus: "USA", eng: "USA", chn: "USA" },
    ]);
  });

  it("drops entries without an id or name", () => {
    expect(
      normalizeCountries([{ eng: "No id" }, { id: 1 }, "not-an-object"])
    ).toEqual([]);
  });
});