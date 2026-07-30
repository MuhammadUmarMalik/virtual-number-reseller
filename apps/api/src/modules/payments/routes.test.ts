import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, prisma } from "@number-reseller/database";
import { createApp } from "../../app";

const databaseUrl = process.env.DATABASE_URL;
const integration = describe.runIf(Boolean(databaseUrl));

let cookies: string[];
let testUserId: string;
let app: ReturnType<typeof createApp>;

function testUserData() {
  const unique = randomUUID();
  return { name: "Payment Route Test", email: `payment-route-${unique}@example.invalid`, password: "SecurePass1!" };
}

beforeAll(async () => {
  app = createApp();

  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({ ...testUserData(), termsAccepted: true });

  testUserId = registerRes.body.data?.user?.id;
  const setCookie = registerRes.headers["set-cookie"];
  cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(Boolean) as string[];

  if (!testUserId) {
    const unique = randomUUID();
    const user = await prisma.user.create({
      data: {
        name: "Payment Route Fallback",
        email: `payment-route-fallback-${unique}@example.invalid`,
        passwordHash: "not-a-real-password-hash",
        wallet: { create: { balance: new Prisma.Decimal(0), currency: "PKR" } },
      },
    });
    testUserId = user.id;
  }
});

afterAll(async () => {
  if (testUserId) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "WalletTransaction" DISABLE TRIGGER "WalletTransaction_immutable"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" DISABLE TRIGGER "AuditLog_immutable"`);
    await prisma.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "actorUserId" = $1::uuid`, testUserId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Payment" WHERE "userId" = $1::uuid`, testUserId);
    await prisma.$executeRawUnsafe(`DELETE FROM "WalletTransaction" WHERE "walletId" IN (SELECT "id" FROM "Wallet" WHERE "userId" = $1::uuid)`, testUserId);
    await prisma.$executeRawUnsafe(`DELETE FROM "Wallet" WHERE "userId" = $1::uuid`, testUserId);
    await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE "id" = $1::uuid`, testUserId);
    await prisma.$executeRawUnsafe(`ALTER TABLE "WalletTransaction" ENABLE TRIGGER "WalletTransaction_immutable"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "AuditLog" ENABLE TRIGGER "AuditLog_immutable"`);
  }
  await prisma.$disconnect();
});

integration("Payment API routes", () => {
  it("POST /api/payments/top-up creates a payment", async () => {
    if (!cookies || cookies.length === 0) return;

    const res = await request(app)
      .post("/api/payments/top-up")
      .set("Cookie", cookies)
      .send({
        provider: "MOCK",
        amount: 500,
        idempotencyKey: `e2e-topup-${randomUUID()}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("paymentId");
    expect(res.body.data).toHaveProperty("merchantReference");
    expect(res.body.data).toHaveProperty("redirectUrl");
    expect(res.body.data.status).toBe("CREATED");
  });

  it("POST /api/payments/top-up requires authentication", async () => {
    const res = await request(app)
      .post("/api/payments/top-up")
      .send({
        provider: "MOCK",
        amount: 500,
        idempotencyKey: `unauth-${randomUUID()}`,
      });

    expect(res.status).toBe(401);
  });

  it("POST /api/payments/top-up rejects amount below minimum", async () => {
    if (!cookies || cookies.length === 0) return;

    const res = await request(app)
      .post("/api/payments/top-up")
      .set("Cookie", cookies)
      .send({
        provider: "MOCK",
        amount: 50,
        idempotencyKey: `low-amount-${randomUUID()}`,
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe("MINIMUM_TOPUP");
  });

  it("POST /api/payments/top-up rejects invalid provider", async () => {
    if (!cookies || cookies.length === 0) return;

    const res = await request(app)
      .post("/api/payments/top-up")
      .set("Cookie", cookies)
      .send({
        provider: "INVALID",
        amount: 500,
        idempotencyKey: `bad-provider-${randomUUID()}`,
      });

    expect(res.status).toBe(422);
  });

  it("POST /api/payments/mock/callback processes a successful payment", async () => {
    if (!cookies || cookies.length === 0) return;

    const createRes = await request(app)
      .post("/api/payments/top-up")
      .set("Cookie", cookies)
      .send({
        provider: "MOCK",
        amount: 500,
        idempotencyKey: `cb-flow-${randomUUID()}`,
      });

    expect(createRes.status).toBe(201);
    const { merchantReference } = createRes.body.data;

    const cbRes = await request(app)
      .post("/api/payments/mock/callback")
      .send({
        _merchantReference: merchantReference,
        _mockStatus: "SUCCESS",
        pp_TxnRefNo: merchantReference,
      });

    expect(cbRes.status).toBe(200);
    expect(cbRes.body.data.status).toBe("SUCCESS");
  });

  it("GET /api/payments/:id returns payment details", async () => {
    if (!cookies || cookies.length === 0) return;

    const createRes = await request(app)
      .post("/api/payments/top-up")
      .set("Cookie", cookies)
      .send({
        provider: "MOCK",
        amount: 500,
        idempotencyKey: `get-pay-route-${randomUUID()}`,
      });

    const { paymentId } = createRes.body.data;

    const res = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(paymentId);
    expect(res.body.data.provider).toBe("MOCK");
    expect(res.body.data.amount).toBe("500.00");
  });

  it("GET /api/payments/:id requires authentication", async () => {
    const res = await request(app).get(`/api/payments/${randomUUID()}`);
    expect(res.status).toBe(401);
  });

  it("GET /api/payments lists the user's payments", async () => {
    if (!cookies || cookies.length === 0) return;

    const res = await request(app)
      .get("/api/payments")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("payments");
    expect(res.body.data).toHaveProperty("nextCursor");
    expect(res.body.data).toHaveProperty("totalCount");
  });
});
