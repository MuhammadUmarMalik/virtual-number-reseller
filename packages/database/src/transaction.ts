import { Prisma, PrismaClient, Wallet } from "@prisma/client";

export interface WalletLockOptions {
  maxWaitMs?: number;
  timeoutMs?: number;
}

export type WalletTransactionClient = Prisma.TransactionClient;

type LockedWalletRow = Pick<Wallet, "id">;

/**
 * Runs work in a PostgreSQL transaction after taking a row-level lock on the
 * wallet. Keep the callback short and do not make remote network calls inside it.
 */
export async function withLockedWallet<T>(
  client: PrismaClient,
  walletId: string,
  work: (transaction: WalletTransactionClient, wallet: Wallet) => Promise<T>,
  options: WalletLockOptions = {},
): Promise<T> {
  return client.$transaction(
    async (transaction) => {
      const rows = await transaction.$queryRaw<LockedWalletRow[]>`
        SELECT "id"
        FROM "Wallet"
        WHERE "id" = ${walletId}::uuid
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error(`Wallet ${walletId} was not found.`);
      }

      const wallet = await transaction.wallet.findUniqueOrThrow({
        where: { id: walletId },
      });

      return work(transaction, wallet);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: options.maxWaitMs ?? 5_000,
      timeout: options.timeoutMs ?? 10_000,
    },
  );
}
