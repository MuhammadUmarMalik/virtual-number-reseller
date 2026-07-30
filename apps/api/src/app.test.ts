import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("API foundation", () => {
  it("returns health status", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.requestId).toMatch(/^req_/);
  });

  it("uses the shared error envelope for missing routes", async () => {
    const response = await request(createApp()).get("/api/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("protects number purchasing before route handling", async () => {
    const response = await request(createApp()).post("/api/orders").send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTHENTICATION_REQUIRED");
  });
});
