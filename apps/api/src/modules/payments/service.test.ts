import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, beforeEach } from "vitest";
import { Prisma, prisma } from "@number-reseller/database";
import { PaymentService } from "./service";
import { getMockAdapter } from "./adapters/index";

const databaseUrl = process.env.DATABASE_URL;
const integration = describe.runIf(Boolean(databaseUrl));

let paymentService: PaymentService;
let testUserId: string;
let testUserWithTopupDoneId: string;

function testUserData() {
  const unique = randomUUID();
  return {
    name: "Payment Test User",
    email: `payment-test-${unique}@example.invalid`,
    passwordHash: "not-a-real-password-hash",
  };
}

async function createTestUser() {
  const user = await prisma.user.create({
    data: {
      ...testUserData(),
      wallet: { create: { balance: new Prisma.Decimal(0), currency: "PKR" } },
    },
    include: { wallet: true },
  });
  return { userId: user.id, walletId: user.wallet!.id };
}

async function createTestUserWithTopupDone() {
  const user = await prisma.user.create({
    data: {
      ...testUserData(),
      initialTopupDone: true,
      wallet: { create: { balance: new Prisma.Decimal(0), currency: "PKR" } },
    },
    include: { wallet: true },
  });
  return { userId: user.id, walletId: user.wallet!.id };
}

afterAll(async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Payment", "WalletTransaction", "Wallet", "User" CASCADE`);
  await prisma.$disconnect();
});

integration("PaymentService", () => {
  beforeEach(async () => {
    paymentService = new PaymentService();
    const data = await createTestUser();
    testUserId = data.userId;
    const data2 = await createTestUserWithTopupDone();
    testUserWithTopupDoneId = data2.userId;
  });

  it("creates a top-up and returns payment details with redirect URL", async () => {
    const result = await paymentService.createTopUp(
      testUserId,
      1000,
      "MOCK",
      `topup-${randomUUID()}`,
      { requestId: "test-req" },
    );

    expect(result.paymentId).toBeDefined();
    expect(result.merchantReference).toBeDefined();
    expect(result.status).toBe("CREATED");
    expect(result.redirectUrl).toContain(result.merchantReference);

    const payment = await prisma.payment.findUnique({
      where: { id: result.paymentId },
    });
    expect(payment).toBeDefined();
    expect(payment!.userId).toBe(testUserId);
    expect(payment!.provider).toBe("MOCK");
    expect(payment!.amount.equals(1000)).toBe(true);
    expect(payment!.status).toBe("CREATED");
  });

  it("returns existing payment on duplicate idempotency key", async () => {
    const key = `dup-${randomUUID()}`;
    const first = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      key,
      { requestId: "test-req" },
    );

    const second = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      key,
      { requestId: "test-req" },
    );

    expect(second.paymentId).toBe(first.paymentId);
    expect(second.merchantReference).toBe(first.merchantReference);
  });

  it("rejects first top-up below PKR 500", async () => {
    await expect(
      paymentService.createTopUp(
        testUserId,
        100,
        "MOCK",
        `low-topup-${randomUUID()}`,
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "MINIMUM_TOPUP" });
  });

  it("accepts first top-up of exactly PKR 500", async () => {
    const result = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `exact-first-${randomUUID()}`,
      { requestId: "test-req" },
    );
    expect(result.paymentId).toBeDefined();
    expect(result.status).toBe("CREATED");
  });

  it("enforces PKR 50 minimum for subsequent top-ups", async () => {
    await expect(
      paymentService.createTopUp(
        testUserWithTopupDoneId,
        20,
        "MOCK",
        `sub-low-${randomUUID()}`,
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "MINIMUM_TOPUP" });
  });

  it("accepts subsequent top-up of exactly PKR 50", async () => {
    const result = await paymentService.createTopUp(
      testUserWithTopupDoneId,
      50,
      "MOCK",
      `sub-exact-${randomUUID()}`,
      { requestId: "test-req" },
    );
    expect(result.paymentId).toBeDefined();
    expect(result.status).toBe("CREATED");
  });

  it("processes a successful callback and credits the wallet", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-success-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const cbResult = await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "SUCCESS",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    expect(cbResult.status).toBe("SUCCESS");
    expect(cbResult.paymentId).toBe(createResult.paymentId);

    const payment = await prisma.payment.findUnique({
      where: { id: createResult.paymentId },
    });
    expect(payment!.status).toBe("SUCCESS");
    expect(payment!.callbackVerified).toBe(true);
    expect(payment!.paidAt).toBeDefined();

    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(user!.initialTopupDone).toBe(true);

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet!.balance.equals(500)).toBe(true);
  });

  it("processes a callback with FAILURE status and does not credit wallet", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-fail-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const cbResult = await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "FAILURE",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    expect(cbResult.status).toBe("FAILED");

    const payment = await prisma.payment.findUnique({
      where: { id: createResult.paymentId },
    });
    expect(payment!.status).toBe("FAILED");

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet!.balance.equals(0)).toBe(true);
  });

  it("processes a callback with CANCELLATION status", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-cancel-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const cbResult = await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "CANCELLATION",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    expect(cbResult.status).toBe("CANCELLED");

    const payment = await prisma.payment.findUnique({
      where: { id: createResult.paymentId },
    });
    expect(payment!.status).toBe("CANCELLED");
  });

  it("returns duplicate response for already-successful payment callback", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-dup-${randomUUID()}`,
      { requestId: "test-req" },
    );

    await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "SUCCESS",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    const duplicate = await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "SUCCESS",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    expect((duplicate as any).duplicate).toBe(true);
    expect(duplicate.status).toBe("SUCCESS");
  });

  it("rejects callback with invalid signature (unverified)", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-badsig-${randomUUID()}`,
      { requestId: "test-req" },
    );

    await expect(
      paymentService.processCallback(
        "MOCK",
        {
          _merchantReference: createResult.merchantReference,
          _mockStatus: "INVALID_SIGNATURE",
          pp_TxnRefNo: createResult.merchantReference,
        },
        {},
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "CALLBACK_VERIFICATION_FAILED" });
  });

  it("rejects callback with missing merchant reference", async () => {
    await expect(
      paymentService.processCallback(
        "MOCK",
        {},
        {},
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "INVALID_CALLBACK" });
  });

  it("rejects callback for non-existent merchant reference", async () => {
    await expect(
      paymentService.processCallback(
        "MOCK",
        { pp_TxnRefNo: "does-not-exist" },
        {},
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "INVALID_CALLBACK" });
  });

  it("rejects callback for already closed (failed/cancelled) payment", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-closed-${randomUUID()}`,
      { requestId: "test-req" },
    );

    await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "FAILURE",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    await expect(
      paymentService.processCallback(
        "MOCK",
        {
          _merchantReference: createResult.merchantReference,
          _mockStatus: "SUCCESS",
          pp_TxnRefNo: createResult.merchantReference,
        },
        {},
        { requestId: "test-req" },
      ),
    ).rejects.toMatchObject({ code: "PAYMENT_CLOSED" });
  });

  it("gets a payment by ID", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `get-pay-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const payment = await paymentService.getPayment(createResult.paymentId, testUserId);

    expect(payment.id).toBe(createResult.paymentId);
    expect(payment.provider).toBe("MOCK");
    expect(payment.amount).toBe("500.00");
    expect(payment.currency).toBe("PKR");
    expect(payment.status).toBe("CREATED");
    expect(payment.merchantReference).toBe(createResult.merchantReference);
  });

  it("prevents accessing another user's payment", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `forbid-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const otherUserId = randomUUID();
    await expect(
      paymentService.getPayment(createResult.paymentId, otherUserId),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws NOT_FOUND for non-existent payment ID", async () => {
    await expect(
      paymentService.getPayment(randomUUID(), testUserId),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lists payments with pagination", async () => {
    for (let i = 0; i < 3; i++) {
      await paymentService.createTopUp(testUserId, 500, "MOCK", `list-${i}-${randomUUID()}`, { requestId: "test-req" });
    }

    const result = await paymentService.listPayments(testUserId);
    expect(result.payments.length).toBeGreaterThanOrEqual(3);
    expect(result.totalCount).toBeGreaterThanOrEqual(3);
  });

  it("processes a callback with PENDING status", async () => {
    const createResult = await paymentService.createTopUp(
      testUserId,
      500,
      "MOCK",
      `cb-pending-${randomUUID()}`,
      { requestId: "test-req" },
    );

    const cbResult = await paymentService.processCallback(
      "MOCK",
      {
        _merchantReference: createResult.merchantReference,
        _mockStatus: "PENDING",
        pp_TxnRefNo: createResult.merchantReference,
      },
      {},
      { requestId: "test-req" },
    );

    expect(cbResult.status).toBe("PENDING");

    const payment = await prisma.payment.findUnique({
      where: { id: createResult.paymentId },
    });
    expect(payment!.status).toBe("PENDING");

    const wallet = await prisma.wallet.findUnique({ where: { userId: testUserId } });
    expect(wallet!.balance.equals(0)).toBe(true);
  });
});
