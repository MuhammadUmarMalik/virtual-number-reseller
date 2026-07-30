import { Prisma, prisma, WalletTransactionClient, positiveMoney, addMoney, subtractMoney, MONEY_ZERO } from "@number-reseller/database";
import { ApiError } from "../../common/errors";

type TxType = "TOP_UP" | "PURCHASE" | "REFUND" | "ADMIN_CREDIT" | "ADMIN_DEBIT" | "REVERSAL";
type TxDirection = "CREDIT" | "DEBIT";

export type WalletResult = {
  balance: string;
  currency: string;
  transaction: {
    id: string;
    type: TxType;
    amount: string;
    direction: TxDirection;
    balanceBefore: string;
    balanceAfter: string;
    status: string;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
    description: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
  };
};

export type PaginatedTransactions = {
  transactions: Array<{
    id: string;
    type: string;
    amount: string;
    direction: string;
    balanceBefore: string;
    balanceAfter: string;
    status: string;
    referenceType: string;
    referenceId: string;
    idempotencyKey: string;
    description: string | null;
    metadata: Prisma.JsonValue | null;
    paymentId: string | null;
    createdAt: Date;
  }>;
  nextCursor: string | null;
  totalCount: number;
};

interface RequestContext {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

const MINIMUM_FIRST_TOPUP = new Prisma.Decimal(500);

function auditData(
  context: RequestContext,
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  afterData?: Prisma.InputJsonValue,
  metadata?: Prisma.InputJsonValue,
): Prisma.AuditLogCreateInput {
  return {
    ...(actorUserId ? { actor: { connect: { id: actorUserId } } } : {}),
    action,
    entityType,
    entityId,
    requestId: context.requestId,
    ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    ...(afterData ? { afterData } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export class WalletService {
  constructor(private readonly database = prisma) {}

  async getBalance(userId: string) {
    const wallet = await this.database.wallet.findUnique({
      where: { userId },
      select: { balance: true, currency: true, id: true },
    });
    if (!wallet) throw new ApiError("WALLET_NOT_FOUND", "Wallet not found.", 404);
    return { balance: formatDecimal(wallet.balance), currency: wallet.currency, walletId: wallet.id };
  }

  async getTransactions(
    userId: string,
    filters: {
      type?: string;
      search?: string;
      from?: string;
      to?: string;
      cursor?: string;
      take?: number;
    },
  ) {
    const wallet = await this.database.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new ApiError("WALLET_NOT_FOUND", "Wallet not found.", 404);

    const where: Prisma.WalletTransactionWhereInput = { walletId: wallet.id };
    if (filters.type) where.type = filters.type as any;
    if (filters.search) {
      where.OR = [
        { referenceId: { contains: filters.search, mode: "insensitive" } },
        { idempotencyKey: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { referenceType: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const take = Math.min(filters.take ?? 20, 100);
    const cursor = filters.cursor ? { id: filters.cursor } : undefined;

    const [transactions, totalCount] = await Promise.all([
      this.database.walletTransaction.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: take + 1,
        ...(cursor ? { cursor, skip: 1 } : {}),
      }),
      this.database.walletTransaction.count({ where }),
    ]);

    const hasMore = transactions.length > take;
    const items = hasMore ? transactions.slice(0, take) : transactions;
    const lastItem = hasMore ? items[items.length - 1] : undefined;
    const nextCursor = lastItem?.id ?? null;

    return {
      transactions: items.map((t) => ({
        id: t.id,
        type: t.type,
        amount: formatDecimal(t.amount),
        direction: t.direction,
        balanceBefore: formatDecimal(t.balanceBefore),
        balanceAfter: formatDecimal(t.balanceAfter),
        status: t.status,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        idempotencyKey: t.idempotencyKey,
        description: t.description,
        metadata: t.metadata,
        paymentId: t.paymentId,
        createdAt: t.createdAt,
      })),
      nextCursor,
      totalCount,
    };
  }

  async credit(
    userId: string,
    inputAmount: Prisma.Decimal,
    referenceType: string,
    referenceId: string,
    idempotencyKey: string,
    description?: string,
    metadata?: Prisma.InputJsonValue,
    context?: RequestContext,
    options?: { setInitialTopupDone?: boolean },
  ) {
    const amount = positiveMoney(inputAmount);
    const txType = referenceType === "PAYMENT" ? "TOP_UP" : "ADMIN_CREDIT" as TxType;

    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, userId, context);

      const wallet = await this.lockWallet(tx, userId);
      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { initialTopupDone: true },
      });

      if (!user.initialTopupDone && options?.setInitialTopupDone) {
        if (amount.lessThan(MINIMUM_FIRST_TOPUP)) {
          throw new ApiError(
            "INSUFFICIENT_TOPUP",
            `Your first top-up must be at least PKR ${MINIMUM_FIRST_TOPUP.toFixed(2)}.`,
            400,
          );
        }
      }

      const balanceAfter = addMoney(wallet.balance, amount);

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: txType as any,
          amount,
          direction: "CREDIT",
          balanceBefore: wallet.balance,
          balanceAfter,
          status: "COMPLETED",
          referenceType,
          referenceId,
          idempotencyKey,
          description: description ?? null,
          ...(metadata !== undefined ? { metadata } : {}),
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter, version: { increment: 1 } },
      });

      if (options?.setInitialTopupDone && !user.initialTopupDone) {
        await tx.user.update({
          where: { id: userId },
          data: { initialTopupDone: true },
        });
      }

      if (context) {
        await tx.auditLog.create({
          data: auditData(context, userId, "WALLET_CREDITED", "WalletTransaction", ledger.id, {
            type: referenceType,
            amount: amount.toFixed(2),
            balanceBefore: wallet.balance.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
          }),
        });
      }

      return this.walletResult(wallet.id, balanceAfter, ledger);
    });
  }

  async debit(
    userId: string,
    inputAmount: Prisma.Decimal,
    referenceType: string,
    referenceId: string,
    idempotencyKey: string,
    description?: string,
    metadata?: Prisma.InputJsonValue,
    context?: RequestContext,
  ) {
    const amount = positiveMoney(inputAmount);
    const txType = referenceType === "PURCHASE" ? "PURCHASE" : "ADMIN_DEBIT" as TxType;

    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, userId, context);

      const wallet = await this.lockWallet(tx, userId);

      if (wallet.balance.lessThan(amount)) {
        throw new ApiError(
          "INSUFFICIENT_BALANCE",
          `Your wallet balance is too low. You need PKR ${amount.toFixed(2)} but have PKR ${wallet.balance.toFixed(2)}.`,
          400,
        );
      }

      const balanceAfter = subtractMoney(wallet.balance, amount);

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: txType as any,
          amount,
          direction: "DEBIT",
          balanceBefore: wallet.balance,
          balanceAfter,
          status: "COMPLETED",
          referenceType,
          referenceId,
          idempotencyKey,
          description: description ?? null,
          ...(metadata !== undefined ? { metadata } : {}),
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter, version: { increment: 1 } },
      });

      if (context) {
        await tx.auditLog.create({
          data: auditData(context, userId, "WALLET_DEBITED", "WalletTransaction", ledger.id, {
            type: referenceType,
            amount: amount.toFixed(2),
            balanceBefore: wallet.balance.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
          }),
        });
      }

      return this.walletResult(wallet.id, balanceAfter, ledger);
    });
  }

  async refund(
    userId: string,
    inputAmount: Prisma.Decimal,
    referenceType: string,
    referenceId: string,
    idempotencyKey: string,
    description?: string,
    context?: RequestContext,
  ) {
    const amount = positiveMoney(inputAmount);

    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, userId, context);

      const wallet = await this.lockWallet(tx, userId);
      const balanceAfter = addMoney(wallet.balance, amount);

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount,
          direction: "CREDIT",
          balanceBefore: wallet.balance,
          balanceAfter,
          status: "COMPLETED",
          referenceType,
          referenceId,
          idempotencyKey,
          description: description ?? null,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter, version: { increment: 1 } },
      });

      if (context) {
        await tx.auditLog.create({
          data: auditData(context, userId, "WALLET_REFUNDED", "WalletTransaction", ledger.id, {
            amount: amount.toFixed(2),
            referenceType,
            balanceBefore: wallet.balance.toFixed(2),
            balanceAfter: balanceAfter.toFixed(2),
          }),
        });
      }

      return this.walletResult(wallet.id, balanceAfter, ledger);
    });
  }

  async adminCredit(
    userId: string,
    inputAmount: Prisma.Decimal,
    reason: string,
    adminId: string,
    idempotencyKey: string,
    context: RequestContext,
  ) {
    const amount = positiveMoney(inputAmount);

    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, adminId, context);

      const wallet = await this.lockWallet(tx, userId);
      const balanceAfter = addMoney(wallet.balance, amount);

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_CREDIT",
          amount,
          direction: "CREDIT",
          balanceBefore: wallet.balance,
          balanceAfter,
          status: "COMPLETED",
          referenceType: "ADMIN",
          referenceId: adminId,
          idempotencyKey,
          description: reason,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter, version: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: auditData(context, adminId, "ADMIN_WALLET_CREDIT", "WalletTransaction", ledger.id, {
          targetUserId: userId,
          reason,
          amount: amount.toFixed(2),
          balanceBefore: wallet.balance.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        }),
      });

      return this.walletResult(wallet.id, balanceAfter, ledger);
    });
  }

  async adminDebit(
    userId: string,
    inputAmount: Prisma.Decimal,
    reason: string,
    adminId: string,
    idempotencyKey: string,
    context: RequestContext,
  ) {
    const amount = positiveMoney(inputAmount);

    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, adminId, context);

      const wallet = await this.lockWallet(tx, userId);

      if (wallet.balance.lessThan(amount)) {
        throw new ApiError(
          "INSUFFICIENT_BALANCE",
          `Cannot debit. User has PKR ${wallet.balance.toFixed(2)} but the debit amount is PKR ${amount.toFixed(2)}.`,
          400,
        );
      }

      const balanceAfter = subtractMoney(wallet.balance, amount);

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_DEBIT",
          amount,
          direction: "DEBIT",
          balanceBefore: wallet.balance,
          balanceAfter,
          status: "COMPLETED",
          referenceType: "ADMIN",
          referenceId: adminId,
          idempotencyKey,
          description: reason,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter, version: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: auditData(context, adminId, "ADMIN_WALLET_DEBIT", "WalletTransaction", ledger.id, {
          targetUserId: userId,
          reason,
          amount: amount.toFixed(2),
          balanceBefore: wallet.balance.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
        }),
      });

      return this.walletResult(wallet.id, balanceAfter, ledger);
    });
  }

  async reversal(
    transactionId: string,
    reason: string,
    adminId: string,
    idempotencyKey: string,
    context: RequestContext,
  ) {
    return this.database.$transaction(async (tx) => {
      await this.checkIdempotency(tx, idempotencyKey, adminId, context);

      const original = await tx.walletTransaction.findUnique({
        where: { id: transactionId },
        include: { wallet: true },
      });
      if (!original) throw new ApiError("TRANSACTION_NOT_FOUND", "Transaction not found.", 404);
      if (original.status !== "COMPLETED") {
        throw new ApiError("TRANSACTION_NOT_COMPLETED", "Only completed transactions can be reversed.", 400);
      }
      if (original.type === "REVERSAL") {
        throw new ApiError("ALREADY_REVERSED", "Cannot reverse a reversal.", 400);
      }

      const existingReversal = await tx.walletTransaction.findFirst({
        where: { originalTransactionId: transactionId, status: "COMPLETED" },
      });
      if (existingReversal) {
        throw new ApiError("ALREADY_REVERSED", "This transaction has already been reversed.", 400);
      }

      const wallet = await this.lockWallet(tx, original.wallet.userId);

      const reversalAmount = original.amount;
      const reversalDir: TxDirection = original.direction === "CREDIT" ? "DEBIT" : "CREDIT";
      const newBalance = original.direction === "CREDIT"
        ? subtractMoney(wallet.balance, reversalAmount)
        : addMoney(wallet.balance, reversalAmount);

      if (newBalance.isNegative()) {
        throw new ApiError(
          "INSUFFICIENT_BALANCE",
          `Cannot reverse. The reversal would make the wallet negative (PKR ${newBalance.toFixed(2)}).`,
          400,
        );
      }

      const ledger = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REVERSAL",
          amount: reversalAmount,
          direction: reversalDir,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          status: "COMPLETED",
          referenceType: "REVERSAL",
          referenceId: transactionId,
          originalTransactionId: transactionId,
          idempotencyKey,
          description: `Reversal of ${original.type}: ${reason}`,
          metadata: { reason, originalType: original.type, originalReferenceType: original.referenceType },
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance, version: { increment: 1 } },
      });

      await tx.auditLog.create({
        data: auditData(context, adminId, "WALLET_REVERSAL", "WalletTransaction", ledger.id, {
          originalTransactionId: transactionId,
          reason,
          originalType: original.type,
          amount: reversalAmount.toFixed(2),
          balanceBefore: wallet.balance.toFixed(2),
          balanceAfter: newBalance.toFixed(2),
        }),
      });

      return this.walletResult(wallet.id, newBalance, ledger);
    });
  }

  async checkBalance(userId: string) {
    const wallet = await this.database.wallet.findUnique({
      where: { userId },
      select: { id: true, balance: true, currency: true, version: true },
    });
    if (!wallet) throw new ApiError("WALLET_NOT_FOUND", "Wallet not found.", 404);

    const credits = await this.database.walletTransaction.aggregate({
      where: { walletId: wallet.id, status: "COMPLETED", direction: "CREDIT" },
      _sum: { amount: true },
    });

    const debits = await this.database.walletTransaction.aggregate({
      where: { walletId: wallet.id, status: "COMPLETED", direction: "DEBIT" },
      _sum: { amount: true },
    });

    const totalCredits = credits._sum.amount ?? MONEY_ZERO;
    const totalDebits = debits._sum.amount ?? MONEY_ZERO;
    const computedBalance = subtractMoney(totalCredits, totalDebits);
    const matches = computedBalance.equals(wallet.balance);

    return {
      walletBalance: formatDecimal(wallet.balance),
      computedBalance: formatDecimal(computedBalance),
      totalCredits: formatDecimal(totalCredits),
      totalDebits: formatDecimal(totalDebits),
      matches,
      version: wallet.version,
      currency: wallet.currency,
    };
  }

  private async checkIdempotency(
    tx: WalletTransactionClient,
    key: string,
    userId: string,
    context?: RequestContext,
  ) {
    const existing = await tx.walletTransaction.findUnique({
      where: { idempotencyKey: key },
      select: { id: true, status: true },
    });
    if (existing) {
      if (context) {
        await tx.auditLog.create({
          data: auditData(context, userId, "IDEMPOTENCY_KEY_REUSED", "WalletTransaction", existing.id),
        });
      }
      throw new ApiError(
        "DUPLICATE_REQUEST",
        "This idempotency key has already been used. Duplicate requests are not allowed.",
        409,
      );
    }
  }

  private async lockWallet(tx: WalletTransactionClient, userId: string) {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT w."id" FROM "Wallet" w
      WHERE w."userId" = ${userId}::uuid
      FOR UPDATE
    `;
    if (rows.length === 0) throw new ApiError("WALLET_NOT_FOUND", "Wallet not found.", 404);

    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { id: rows[0]!.id },
    });

    return wallet;
  }

  private walletResult(
    walletId: string,
    balance: Prisma.Decimal,
    ledger: { id: string; type: string; amount: Prisma.Decimal; direction: string; balanceBefore: Prisma.Decimal; balanceAfter: Prisma.Decimal; status: string; referenceType: string; referenceId: string; idempotencyKey: string; description: string | null; metadata: Prisma.JsonValue | null; createdAt: Date },
  ): WalletResult {
    return {
      balance: formatDecimal(balance),
      currency: "PKR",
      transaction: {
        id: ledger.id,
        type: ledger.type as TxType,
        amount: formatDecimal(ledger.amount),
        direction: ledger.direction as TxDirection,
        balanceBefore: formatDecimal(ledger.balanceBefore),
        balanceAfter: formatDecimal(ledger.balanceAfter),
        status: ledger.status,
        referenceType: ledger.referenceType,
        referenceId: ledger.referenceId,
        idempotencyKey: ledger.idempotencyKey,
        description: ledger.description,
        metadata: ledger.metadata,
        createdAt: ledger.createdAt,
      },
    };
  }
}

function formatDecimal(value: Prisma.Decimal): string {
  return value.toFixed(2);
}
