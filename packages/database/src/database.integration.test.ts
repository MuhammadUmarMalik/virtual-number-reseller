import { randomUUID } from "node:crypto";

import { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { withLockedWallet } from "./transaction.js";

const databaseUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient();
const integration = describe.runIf(Boolean(databaseUrl));

function testUserData() {
  const unique = randomUUID();

  return {
    name: "Database Integration Test",
    email: `database-test-${unique}@example.invalid`,
    passwordHash: "not-a-real-password-hash",
  };
}

afterAll(async () => {
  await prisma.$disconnect();
});

integration("PostgreSQL wallet protections", () => {
  it("rejects a direct balance mutation without a ledger row", async () => {
    await expect(
      prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            ...testUserData(),
            wallet: { create: {} },
          },
          include: { wallet: true },
        });

        await transaction.wallet.update({
          where: { id: user.wallet!.id },
          data: {
            balance: new Prisma.Decimal(10),
            version: { increment: 1 },
          },
        });
      }),
    ).rejects.toThrow(/matching completed ledger entry/);
  });

  it("locks a wallet and atomically accepts a matching ledger mutation", async () => {
    const user = await prisma.user.create({
      data: {
        ...testUserData(),
        wallet: { create: {} },
      },
      include: { wallet: true },
    });
    const rollback = new Error("ROLLBACK_TEST_TRANSACTION");

    try {
      await expect(
        withLockedWallet(prisma, user.wallet!.id, async (transaction, wallet) => {
          const balanceAfter = wallet.balance.plus(25);

          await transaction.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "ADMIN_CREDIT",
              amount: new Prisma.Decimal(25),
              direction: "CREDIT",
              balanceBefore: wallet.balance,
              balanceAfter,
              status: "COMPLETED",
              referenceType: "DATABASE_TEST",
              referenceId: user.id,
              idempotencyKey: `database-test-${randomUUID()}`,
            },
          });

          const updated = await transaction.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: balanceAfter,
              version: { increment: 1 },
            },
          });

          expect(updated.balance.equals(25)).toBe(true);
          expect(updated.version).toBe(1);
          throw rollback;
        }),
      ).rejects.toBe(rollback);

      const unchanged = await prisma.wallet.findUniqueOrThrow({
        where: { id: user.wallet!.id },
      });
      expect(unchanged.balance.isZero()).toBe(true);
      expect(unchanged.version).toBe(0);
    } finally {
      await prisma.wallet.delete({ where: { id: user.wallet!.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("keeps ledger rows immutable", async () => {
    await expect(
      prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            ...testUserData(),
            wallet: { create: {} },
          },
          include: { wallet: true },
        });
        const ledger = await transaction.walletTransaction.create({
          data: {
            walletId: user.wallet!.id,
            type: "ADMIN_CREDIT",
            amount: new Prisma.Decimal(10),
            direction: "CREDIT",
            balanceBefore: new Prisma.Decimal(0),
            balanceAfter: new Prisma.Decimal(0),
            status: "FAILED",
            referenceType: "DATABASE_TEST",
            referenceId: user.id,
            idempotencyKey: `database-test-${randomUUID()}`,
          },
        });

        await transaction.walletTransaction.update({
          where: { id: ledger.id },
          data: { description: "an invalid historical edit" },
        });
      }),
    ).rejects.toThrow(/records are immutable/);
  });

  it("allows only one completed top-up credit per payment", async () => {
    await expect(
      prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            ...testUserData(),
            wallet: { create: {} },
          },
          include: { wallet: true },
        });
        const payment = await transaction.payment.create({
          data: {
            userId: user.id,
            provider: "MOCK",
            amount: new Prisma.Decimal(50),
            merchantReference: `merchant-${randomUUID()}`,
            idempotencyKey: `payment-${randomUUID()}`,
          },
        });
        const common = {
          walletId: user.wallet!.id,
          paymentId: payment.id,
          type: "TOP_UP" as const,
          amount: new Prisma.Decimal(50),
          direction: "CREDIT" as const,
          balanceBefore: new Prisma.Decimal(0),
          balanceAfter: new Prisma.Decimal(50),
          status: "COMPLETED" as const,
          referenceType: "PAYMENT",
          referenceId: payment.id,
        };

        await transaction.walletTransaction.create({
          data: { ...common, idempotencyKey: `credit-${randomUUID()}` },
        });
        await transaction.walletTransaction.create({
          data: { ...common, idempotencyKey: `credit-${randomUUID()}` },
        });
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
