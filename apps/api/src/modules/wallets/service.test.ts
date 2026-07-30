import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, beforeEach } from "vitest";
import { Prisma, prisma } from "@number-reseller/database";
import { WalletService } from "./service";

const databaseUrl = process.env.DATABASE_URL;
const integration = describe.runIf(Boolean(databaseUrl));

let walletService: WalletService;
let testUserId: string;
let testWalletId: string;

function testUserData() {
  const unique = randomUUID();
  return {
    name: "Wallet Test User",
    email: `wallet-test-${unique}@example.invalid`,
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

async function createAdminUser() {
  const unique = randomUUID();
  const user = await prisma.user.create({
    data: {
      name: "Wallet Admin",
      email: `wallet-admin-${unique}@example.invalid`,
      passwordHash: "not-a-real-password-hash",
      role: "ADMIN",
    },
  });
  return user.id;
}

afterAll(async () => {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "WalletTransaction", "Wallet", "AuditLog" CASCADE`);
  await prisma.$disconnect();
});

integration("WalletService", () => {
  beforeEach(async () => {
    walletService = new WalletService(prisma);
    const data = await createTestUser();
    testUserId = data.userId;
    testWalletId = data.walletId;
  });

  it("credits a wallet and returns the updated balance", async () => {
    const result = await walletService.credit(
      testUserId,
      new Prisma.Decimal("100.00"),
      "PAYMENT",
      randomUUID(),
      `credit-test-${randomUUID()}`,
      "Test credit",
    );

    expect(result.balance).toBe("100.00");
    expect(result.transaction.direction).toBe("CREDIT");
    expect(result.transaction.status).toBe("COMPLETED");
    expect(result.transaction.balanceBefore).toBe("0.00");
    expect(result.transaction.balanceAfter).toBe("100.00");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: testWalletId } });
    expect(wallet.balance.equals(100)).toBe(true);
  });

  it("rejects a duplicate idempotency key", async () => {
    const key = `dup-test-${randomUUID()}`;
    await walletService.credit(testUserId, new Prisma.Decimal("50.00"), "PAYMENT", randomUUID(), key, "First");

    await expect(
      walletService.credit(testUserId, new Prisma.Decimal("30.00"), "PAYMENT", randomUUID(), key, "Duplicate"),
    ).rejects.toMatchObject({ code: "DUPLICATE_REQUEST" });
  });

  it("rejects a debit that would exceed the balance", async () => {
    await expect(
      walletService.debit(
        testUserId,
        new Prisma.Decimal("10.00"),
        "PURCHASE",
        randomUUID(),
        `debit-insufficient-${randomUUID()}`,
        "Test debit",
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_BALANCE" });
  });

  it("debits a wallet after a credit", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("200.00"),
      "PAYMENT",
      randomUUID(),
      `credit-before-debit-${randomUUID()}`,
    );

    const result = await walletService.debit(
      testUserId,
      new Prisma.Decimal("75.50"),
      "PURCHASE",
      randomUUID(),
      `debit-test-${randomUUID()}`,
      "Test purchase",
    );

    expect(result.balance).toBe("124.50");
    expect(result.transaction.direction).toBe("DEBIT");
    expect(result.transaction.balanceBefore).toBe("200.00");
    expect(result.transaction.balanceAfter).toBe("124.50");
  });

  it("processes a refund and credits the wallet", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("500.00"),
      "PAYMENT",
      randomUUID(),
      `credit-for-refund-${randomUUID()}`,
    );

    const result = await walletService.refund(
      testUserId,
      new Prisma.Decimal("50.00"),
      "REFUND",
      randomUUID(),
      `refund-test-${randomUUID()}`,
      "Test refund",
    );

    expect(result.balance).toBe("550.00");
    expect(result.transaction.type).toBe("REFUND");
    expect(result.transaction.direction).toBe("CREDIT");
  });

  it("processes an admin credit adjustment", async () => {
    const adminId = await createAdminUser();
    const result = await walletService.adminCredit(
      testUserId,
      new Prisma.Decimal("1000.00"),
      "Admin adjustment for testing",
      adminId,
      `admin-credit-${randomUUID()}`,
      { requestId: "test-req", ipAddress: "127.0.0.1" },
    );

    expect(result.balance).toBe("1000.00");
    expect(result.transaction.type).toBe("ADMIN_CREDIT");
  });

  it("processes an admin debit adjustment", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("500.00"),
      "PAYMENT",
      randomUUID(),
      `credit-before-admin-debit-${randomUUID()}`,
    );

    const adminId = await createAdminUser();
    const result = await walletService.adminDebit(
      testUserId,
      new Prisma.Decimal("200.00"),
      "Admin debit for testing",
      adminId,
      `admin-debit-${randomUUID()}`,
      { requestId: "test-req", ipAddress: "127.0.0.1" },
    );

    expect(result.balance).toBe("300.00");
    expect(result.transaction.type).toBe("ADMIN_DEBIT");
  });

  it("handles concurrent debit attempts correctly", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("100.00"),
      "PAYMENT",
      randomUUID(),
      `credit-concurrent-${randomUUID()}`,
    );

    const attempts = Array.from({ length: 5 }, (_, i) =>
      walletService.debit(
        testUserId,
        new Prisma.Decimal("30.00"),
        "PURCHASE",
        randomUUID(),
        `concurrent-${i}-${randomUUID()}`,
        `Concurrent debit ${i}`,
      ),
    );

    const results = await Promise.allSettled(attempts);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(3);
    expect(rejected.length).toBe(2);

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: testWalletId } });
    expect(wallet.balance.equals(10)).toBe(true);
  });

  it("detects ledger and wallet balance mismatch", async () => {
    await walletService.credit(
      testUserId,
      new Prisma.Decimal("250.00"),
      "PAYMENT",
      randomUUID(),
      `credit-recon-${randomUUID()}`,
    );

    const result = await walletService.checkBalance(testUserId);
    expect(result.matches).toBe(true);
    expect(result.walletBalance).toBe("250.00");
    expect(result.totalCredits).toBe("250.00");
    expect(result.totalDebits).toBe("0.00");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: testWalletId } });
    const balance = wallet.balance;

    await prisma.walletTransaction.create({
      data: {
        walletId: testWalletId,
        type: "ADMIN_DEBIT",
        amount: new Prisma.Decimal("50.00"),
        direction: "DEBIT",
        balanceBefore: balance,
        balanceAfter: balance,
        status: "FAILED",
        referenceType: "TEST",
        referenceId: randomUUID(),
        idempotencyKey: `recon-failed-${randomUUID()}`,
      },
    });

    const afterRecon = await walletService.checkBalance(testUserId);
    expect(afterRecon.matches).toBe(true);
  });

  it("reverses a completed credit transaction", async () => {
    const creditResult = await walletService.credit(
      testUserId,
      new Prisma.Decimal("100.00"),
      "PAYMENT",
      randomUUID(),
      `credit-reversal-${randomUUID()}`,
    );

    const adminId = await createAdminUser();
    const reversalResult = await walletService.reversal(
      creditResult.transaction.id,
      "Testing reversal",
      adminId,
      `reversal-test-${randomUUID()}`,
      { requestId: "test-req", ipAddress: "127.0.0.1" },
    );

    expect(reversalResult.balance).toBe("0.00");
    expect(reversalResult.transaction.type).toBe("REVERSAL");
    expect(reversalResult.transaction.direction).toBe("DEBIT");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: testWalletId } });
    expect(wallet.balance.equals(0)).toBe(true);
  });

  it("ensures first top-up minimum of PKR 500", async () => {
    await expect(
      walletService.credit(
        testUserId,
        new Prisma.Decimal("100.00"),
        "PAYMENT",
        randomUUID(),
        `first-topup-low-${randomUUID()}`,
        "First top-up too low",
        undefined,
        { requestId: "test-req" },
        { setInitialTopupDone: true },
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_TOPUP" });

    const result = await walletService.credit(
      testUserId,
      new Prisma.Decimal("500.00"),
      "PAYMENT",
      randomUUID(),
      `first-topup-ok-${randomUUID()}`,
      "First top-up valid",
      undefined,
      { requestId: "test-req" },
      { setInitialTopupDone: true },
    );

    expect(result.balance).toBe("500.00");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: testUserId } });
    expect(user.initialTopupDone).toBe(true);
  });
});
