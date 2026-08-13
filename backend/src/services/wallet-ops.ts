import { Prisma } from "@prisma/client";
import type { WalletTransactionType } from "@prisma/client";
import { AppError } from "../utils/app-error.js";

type Tx = Prisma.TransactionClient;

export interface WalletMutationInput {
  userId: string;
  amount: Prisma.Decimal | string | number;
  type: WalletTransactionType;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdBy?: string;
}

export async function creditWallet(tx: Tx, input: WalletMutationInput) {
  return mutateWallet(tx, input, true);
}

export async function debitWallet(tx: Tx, input: WalletMutationInput) {
  return mutateWallet(tx, input, false);
}

/**
 * Mutates a wallet balance and writes a matching wallet transaction.
 *
 * Concurrency safety:
 * - Credits use an atomic `increment` on the balance column.
 * - Debits use an atomic conditional `updateMany` (`balance >= amount`).
 *   PostgreSQL re-evaluates the WHERE clause on the updated row, so two
 *   concurrent debits can never both succeed against the same funds.
 *
 * Both paths run inside the caller's Prisma transaction.
 */
async function mutateWallet(
  tx: Tx,
  input: WalletMutationInput,
  isCredit: boolean
) {
  const amount = new Prisma.Decimal(input.amount.toString());
  if (amount.lte(0)) {
    throw new AppError("Amount must be greater than zero", 400);
  }

  const wallet = await tx.wallet.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });
  if (!wallet) {
    throw new AppError("Wallet not found", 404);
  }

  let balanceAfter: Prisma.Decimal;
  if (isCredit) {
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    });
    balanceAfter = new Prisma.Decimal(updated.balance.toString());
  } else {
    const result = await tx.wallet.updateMany({
      where: { id: wallet.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (result.count === 0) {
      throw new AppError("Insufficient wallet balance", 400);
    }
    const updated = await tx.wallet.findUniqueOrThrow({
      where: { id: wallet.id },
    });
    balanceAfter = new Prisma.Decimal(updated.balance.toString());
  }

  const balanceBefore = isCredit
    ? balanceAfter.sub(amount)
    : balanceAfter.add(amount);

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: input.userId,
      type: input.type,
      amount,
      balanceBefore,
      balanceAfter,
      status: "COMPLETED",
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      description: input.description,
      createdBy: input.createdBy,
    },
  });

  return { walletId: wallet.id, balanceAfter };
}
