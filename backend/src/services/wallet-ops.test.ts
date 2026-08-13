import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import {
  creditWallet,
  debitWallet,
  type WalletMutationInput,
} from "./wallet-ops.js";
import { AppError } from "../utils/app-error.js";

interface FakeWallet {
  id: string;
  balance: Prisma.Decimal;
}

function createFakeTx(initialBalance: string) {
  const wallet: FakeWallet = {
    id: "w1",
    balance: new Prisma.Decimal(initialBalance),
  };
  const created: Record<string, unknown>[] = [];

  const tx = {
    wallet: {
      findUnique: async () => ({ id: wallet.id }),
      update: async (args: { data: { balance?: { increment?: unknown } } }) => {
        const increment = args.data.balance?.increment;
        if (increment) {
          wallet.balance = wallet.balance.add(
            new Prisma.Decimal(increment.toString())
          );
        }
        return { id: wallet.id, balance: wallet.balance };
      },
      updateMany: async (args: {
        where: { balance?: { gte?: unknown } };
        data: { balance?: { decrement?: unknown } };
      }) => {
        const amount = new Prisma.Decimal(
          (args.data.balance?.decrement ?? 0).toString()
        );
        if (wallet.balance.lt(amount)) return { count: 0 };
        wallet.balance = wallet.balance.sub(amount);
        return { count: 1 };
      },
      findUniqueOrThrow: async () => wallet,
    },
    walletTransaction: {
      create: async (args: { data: Record<string, unknown> }) => {
        created.push(args.data);
        return args.data;
      },
    },
  };

  return {
    tx: tx as unknown as Prisma.TransactionClient,
    getBalance: () => wallet.balance.toString(),
    getCreated: () => created,
  };
}

const baseInput: WalletMutationInput = {
  userId: "u1",
  amount: "50.00",
  type: "DEPOSIT",
  description: "test",
};

describe("creditWallet", () => {
  it("increments the balance and writes a transaction record", async () => {
    const { tx, getBalance, getCreated } = createFakeTx("100.00");
    await creditWallet(tx, { ...baseInput, amount: "25.50" });

    expect(getBalance()).toBe("125.5");
    const record = getCreated()[0];
    expect(record.amount?.toString()).toBe("25.5");
    expect(record.balanceBefore?.toString()).toBe("100");
    expect(record.balanceAfter?.toString()).toBe("125.5");
    expect(record.status).toBe("COMPLETED");
    expect(record.type).toBe("DEPOSIT");
  });

  it("rejects non-positive amounts", async () => {
    const { tx } = createFakeTx("100.00");
    await expect(creditWallet(tx, { ...baseInput, amount: "0" })).rejects.toThrow(
      AppError
    );
    await expect(
      creditWallet(tx, { ...baseInput, amount: "-10" })
    ).rejects.toThrow(AppError);
  });

  it("rejects when the wallet does not exist", async () => {
    const tx = {
      wallet: { findUnique: async () => null },
    } as unknown as Prisma.TransactionClient;
    await expect(creditWallet(tx, baseInput)).rejects.toThrow(AppError);
  });
});

describe("debitWallet", () => {
  it("deducts the balance and writes a transaction record", async () => {
    const { tx, getBalance, getCreated } = createFakeTx("100.00");
    await debitWallet(tx, { ...baseInput, amount: "40.00", type: "PURCHASE" });

    expect(getBalance()).toBe("60");
    const record = getCreated()[0];
    expect(record.amount?.toString()).toBe("40");
    expect(record.balanceBefore?.toString()).toBe("100");
    expect(record.balanceAfter?.toString()).toBe("60");
    expect(record.type).toBe("PURCHASE");
  });

  it("fails atomically when the balance is insufficient", async () => {
    const { tx, getBalance, getCreated } = createFakeTx("30.00");
    await expect(
      debitWallet(tx, { ...baseInput, amount: "50.00", type: "PURCHASE" })
    ).rejects.toThrow(AppError);
    expect(getBalance()).toBe("30");
    expect(getCreated()).toHaveLength(0);
  });

  it("allows a debit that exactly matches the balance", async () => {
    const { tx, getBalance } = createFakeTx("30.00");
    await debitWallet(tx, { ...baseInput, amount: "30.00", type: "PURCHASE" });
    expect(getBalance()).toBe("0");
  });
});
