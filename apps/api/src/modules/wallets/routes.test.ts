import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, prisma } from "@number-reseller/database";
import { createApp } from "../../app";
import { WalletService } from "./service";

const databaseUrl = process.env.DATABASE_URL;
const integration = describe.runIf(Boolean(databaseUrl));

let cookies: string[];
let adminCookies: string[];
let testUserId: string;
let walletService: WalletService;
let adminId: string;

function testUserData() {
  const unique = randomUUID();
  return { name: "Wallet Route Test", email: `wallet-route-${unique}@example.invalid`, password: "SecurePass1!" };
}

beforeAll(async () => {
  walletService = new WalletService(prisma);
  const app = createApp();

  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({ ...testUserData(), termsAccepted: true });
  testUserId = registerRes.body.data.user.id;

  const setCookie = registerRes.headers["set-cookie"];
  cookies = (Array.isArray(setCookie) ? setCookie : [setCookie]).filter(Boolean) as string[];

  const adminData = { name: "Admin", email: `admin-wallet-${randomUUID()}@example.invalid`, password: "SecurePass1!" };
  const adminRes = await request(app).post("/api/auth/register").send({ ...adminData, termsAccepted: true });
  adminId = adminRes.body.data.user.id;
  const adminSetCookie = adminRes.headers["set-cookie"];
  adminCookies = (Array.isArray(adminSetCookie) ? adminSetCookie : [adminSetCookie]).filter(Boolean) as string[];

  await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });
});

afterAll(async () => {
  if (testUserId) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "WalletTransaction", "Wallet", "User" CASCADE`);
  }
  await prisma.$disconnect();
});

integration("Wallet API routes", () => {
  it("GET /api/wallet returns the wallet balance", async () => {
    const res = await request(createApp())
      .get("/api/wallet")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("balance");
    expect(res.body.data).toHaveProperty("currency", "PKR");
    expect(res.body.data).toHaveProperty("walletId");
  });

  it("GET /api/wallet requires authentication", async () => {
    const res = await request(createApp()).get("/api/wallet");
    expect(res.status).toBe(401);
  });

  it("GET /api/wallet/transactions returns an empty list for new wallets", async () => {
    const res = await request(createApp())
      .get("/api/wallet/transactions")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toEqual([]);
    expect(res.body.data.totalCount).toBe(0);
  });

  it("GET /api/wallet/transactions returns after a credit", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("500.00"),
      "PAYMENT",
      randomUUID(),
      `route-credit-${randomUUID()}`,
    );

    const res = await request(createApp())
      .get("/api/wallet/transactions")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBe(1);
    expect(res.body.data.transactions[0].type).toBe("TOP_UP");
    expect(res.body.data.transactions[0].direction).toBe("CREDIT");
    expect(res.body.data.totalCount).toBe(1);
  });

  it("GET /api/wallet/transactions filters by type", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("100.00"),
      "PAYMENT",
      randomUUID(),
      `filter-type-${randomUUID()}`,
    );

    const res = await request(createApp())
      .get("/api/wallet/transactions?type=TOP_UP")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.every((t: { type: string }) => t.type === "TOP_UP")).toBe(true);
  });

  it("GET /api/wallet/reconciliation returns balance match", async () => {
    const res = await request(createApp())
      .get("/api/wallet/reconciliation")
      .set("Cookie", adminCookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("matches");
  });
});
