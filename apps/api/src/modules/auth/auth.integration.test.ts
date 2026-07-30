import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@number-reseller/database";
import { createApp } from "../../app";

const integration = describe.runIf(process.env.RUN_AUTH_INTEGRATION === "true");
const email = `auth-${randomUUID()}@example.invalid`;
let userId: string | undefined;

afterAll(async () => {
  if (userId) {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorUserId: userId }, { entityId: userId }] } });
    await prisma.wallet.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

integration("authentication lifecycle", () => {
  it("registers a user and wallet atomically, hashes tokens, and rotates the refresh session", async () => {
    const registration = await request(createApp())
      .post("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .send({
        name: "Auth Integration",
        email,
        phone: "+923001234567",
        password: "SecurePassword1!",
        termsAccepted: true
      });

    expect(registration.status).toBe(201);
    expect(registration.body.data.onboarding.wallet).toEqual({ balance: "0", currency: "PKR" });
    expect(registration.body.data.onboarding.canPurchase).toBe(false);
    userId = registration.body.data.user.id;

    const setCookieHeader = registration.headers["set-cookie"];
    const setCookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];
    const refreshCookie = setCookies.find((value: string) =>
      value.startsWith("nr_refresh="),
    );
    expect(refreshCookie).toBeTruthy();
    const rawRefresh = refreshCookie!.split(";")[0]!;
    const rawValue = rawRefresh.slice("nr_refresh=".length);
    const stored = await prisma.refreshToken.findUniqueOrThrow({
      where: { id: rawValue.split(".")[0] }
    });
    expect(stored.hashedToken).not.toContain(rawValue);

    const rotated = await request(createApp())
      .post("/api/auth/refresh")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", rawRefresh);
    expect(rotated.status).toBe(200);
    expect(await prisma.refreshToken.findUniqueOrThrow({ where: { id: stored.id } })).toMatchObject({
      revokedAt: expect.any(Date)
    });

    const reuse = await request(createApp())
      .post("/api/auth/refresh")
      .set("Origin", "http://localhost:3000")
      .set("Cookie", rawRefresh);
    expect(reuse.status).toBe(401);
  });

  it("returns the same public response for unknown password-reset accounts", async () => {
    const response = await request(createApp())
      .post("/api/auth/forgot-password")
      .set("Origin", "http://localhost:3000")
      .send({ email: `missing-${randomUUID()}@example.invalid` });
    expect(response.status).toBe(200);
    expect(response.body.data.message).toMatch(/If an account exists/);
  });
});
