import { beforeEach, describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
  nodeEnv: "development",
  smsbowerWebhookEnabled: true,
  smsbowerWebhookSecret: "",
}));

const processWebhookMock = vi.hoisted(() => vi.fn());

vi.mock("../src/config/env.js", () => ({ env: envMock }));

vi.mock("../src/services/smsbower-activation.service.js", () => ({
  smsbowerActivationService: { processWebhook: processWebhookMock },
}));

import { smsbowerWebhookController } from "../src/controllers/smsbower-webhook.controller.js";

function makeRes() {
  const state: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  };
  return { state, res: res as never };
}

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return {
    body,
    get(name: string) {
      return headers[name.toLowerCase()] ?? headers[name];
    },
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  envMock.nodeEnv = "development";
  envMock.smsbowerWebhookEnabled = true;
  envMock.smsbowerWebhookSecret = "";
  processWebhookMock.mockResolvedValue({ saved: true });
});

describe("smsbower webhook controller", () => {
  it("returns 404 when the webhook is disabled", async () => {
    envMock.smsbowerWebhookEnabled = false;
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(makeReq({}), res);
    expect(state.statusCode).toBe(404);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("fails closed in production when no secret is configured", async () => {
    envMock.nodeEnv = "production";
    envMock.smsbowerWebhookSecret = "";
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(
      makeReq({ activationId: "1", text: "code 1234" }),
      res
    );
    expect(state.statusCode).toBe(404);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("rejects requests with a missing secret header", async () => {
    envMock.smsbowerWebhookSecret = "top-secret";
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(makeReq({}), res);
    expect(state.statusCode).toBe(401);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("rejects requests with a wrong secret header", async () => {
    envMock.smsbowerWebhookSecret = "top-secret";
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(
      makeReq({}, { "x-smsbower-secret": "wrong" }),
      res
    );
    expect(state.statusCode).toBe(401);
  });

  it("accepts a correct secret header", async () => {
    envMock.smsbowerWebhookSecret = "top-secret";
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(
      makeReq(
        { activationId: "1", text: "code 1234" },
        { "x-webhook-secret": "top-secret" }
      ),
      res
    );
    expect(state.statusCode).toBe(200);
    expect(processWebhookMock).toHaveBeenCalledTimes(1);
  });

  it("ignores malformed payloads but still returns 200", async () => {
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(makeReq({}), res);
    expect(state.statusCode).toBe(200);
    expect(processWebhookMock).not.toHaveBeenCalled();
  });

  it("forwards a valid payload and reports ok", async () => {
    const { state, res } = makeRes();
    const payload = {
      activationId: "555",
      service: "wa",
      text: "Your code is 4466",
      code: "4466",
      country: "US",
      receivedAt: "2026-09-13T10:00:00Z",
    };
    await smsbowerWebhookController.handleWebhook(makeReq(payload), res);
    expect(processWebhookMock).toHaveBeenCalledWith(payload);
    expect(state.statusCode).toBe(200);
  });

  it("does not leak internal errors and still returns 200", async () => {
    processWebhookMock.mockRejectedValueOnce(new Error("boom"));
    const { state, res } = makeRes();
    await smsbowerWebhookController.handleWebhook(
      makeReq({ activationId: "1", text: "code 1234" }),
      res
    );
    expect(state.statusCode).toBe(200);
    expect(state.body).toEqual({ success: true, message: "ok" });
  });
});