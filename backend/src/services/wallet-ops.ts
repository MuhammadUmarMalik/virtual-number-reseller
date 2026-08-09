import { Prisma } from "@prisma/client";
import type { WalletTransactionType } from "@prisma/client";

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

async function mutateWallet(
  tx: Tx,
  input: WalletMutationInput,
  isCredit: boolean
) {
  const amount = new Prisma.Decimal(input.amount.toString());
  if (amount.lte(0)) {
    throw new Error("Amount must be greater than zero");
  }

  const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const delta = isCredit ? amount : amount.negated();
  const balanceAfter = wallet.balance.add(delta);

  if (balanceAfter.lt(0)) {
    throw new Error("Insufficient wallet balance");
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: balanceAfter },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId: input.userId,
      type: input.type,
      amount,
      balanceBefore: wallet.balance,
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
