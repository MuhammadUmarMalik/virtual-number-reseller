import { Prisma, prisma } from "@number-reseller/database";
import { randomUUID } from "node:crypto";
import { ApiError } from "../../common/errors";
import { WalletService } from "../wallets/service";
import { getPaymentAdapter } from "./adapters/index";
import type { PaymentProvider, NormalizedPaymentStatus } from "./types";

const walletService = new WalletService();

interface RequestContext {
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

export class PaymentService {
  private readonly database = prisma;

  async createTopUp(
    userId: string,
    amount: number,
    provider: PaymentProvider,
    idempotencyKey: string,
    context?: RequestContext,
  ) {
    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { initialTopupDone: true },
    });
    if (!user) throw new ApiError("USER_NOT_FOUND", "User not found.", 404);

    const minimumTopUp = user.initialTopupDone ? new Prisma.Decimal(50) : new Prisma.Decimal(500);
    const decimalAmount = new Prisma.Decimal(amount);

    if (decimalAmount.lessThan(minimumTopUp)) {
      throw new ApiError(
        "MINIMUM_TOPUP",
        `The minimum top-up amount is PKR ${minimumTopUp.toFixed(2)}${user.initialTopupDone ? "" : " for your first top-up"}.`,
        400,
      );
    }

    const existingIdempotency = await this.database.payment.findUnique({
      where: { idempotencyKey },
      select: { id: true, status: true, merchantReference: true },
    });
    if (existingIdempotency) {
      const adapter = getPaymentAdapter(provider);
      const createResult = await adapter.createPayment({
        merchantReference: existingIdempotency.merchantReference,
        amount: decimalAmount,
        currency: "PKR",
        userId,
      });

      return {
        paymentId: existingIdempotency.id,
        status: existingIdempotency.status,
        merchantReference: existingIdempotency.merchantReference,
        ...createResult.redirectUrl ? { redirectUrl: createResult.redirectUrl } : {},
        ...createResult.formFields ? { formFields: createResult.formFields } : {},
      };
    }

    const merchantReference = this.generateMerchantReference(provider);

    const payment = await this.database.payment.create({
      data: {
        userId,
        provider,
        amount: decimalAmount,
        currency: "PKR",
        merchantReference,
        idempotencyKey,
        status: "CREATED",
      },
    });

    const adapter = getPaymentAdapter(provider);
    const createResult = await adapter.createPayment({
      merchantReference,
      amount: decimalAmount,
      currency: "PKR",
      userId,
    });

    if (createResult.providerTransactionId) {
      await this.database.payment.update({
        where: { id: payment.id },
        data: { providerTransactionId: createResult.providerTransactionId },
      });
    }

    if (context) {
      await this.database.auditLog.create({
        data: {
          actorUserId: userId,
          action: "PAYMENT_CREATED",
          entityType: "Payment",
          entityId: payment.id,
          requestId: context.requestId,
          ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
          ...(context.userAgent ? { userAgent: context.userAgent } : {}),
          afterData: { provider, amount: decimalAmount.toFixed(2), merchantReference },
        },
      });
    }

    return {
      paymentId: payment.id,
      status: payment.status as string,
      merchantReference,
      ...createResult.redirectUrl ? { redirectUrl: createResult.redirectUrl } : {},
      ...createResult.formFields ? { formFields: createResult.formFields } : {},
    };
  }

  async processCallback(
    provider: PaymentProvider,
    rawBody: Record<string, unknown>,
    rawHeaders: Record<string, string | string[] | undefined>,
    context?: RequestContext,
  ) {
    const adapter = getPaymentAdapter(provider);

    const bodyForVerify = { ...rawBody };
    const merchantReference = (rawBody.pp_TxnRefNo ?? rawBody.merchantReference ?? rawBody._merchantReference) as string | undefined;
    if (!merchantReference) {
      throw new ApiError("INVALID_CALLBACK", "Missing merchant reference in callback.", 400);
    }

    const payment = await this.database.payment.findUnique({
      where: { merchantReference: merchantReference as string },
      select: {
        id: true, status: true, amount: true, currency: true, userId: true,
        providerTransactionId: true,
      },
    });
    if (!payment) {
      throw new ApiError("INVALID_CALLBACK", "No payment found for this merchant reference.", 400);
    }

    if (payment.status === "SUCCESS") {
      return this.duplicateCallbackResponse(payment.id, payment.status as string, provider);
    }

    if (payment.status === "FAILED" || payment.status === "CANCELLED" || payment.status === "REVERSED") {
      throw new ApiError("PAYMENT_CLOSED", "This payment is already closed.", 400);
    }

    const expectedAmount = payment.amount.times(100).toFixed(0);

    const verifyResult = await adapter.verifyCallback({
      rawBody: bodyForVerify,
      rawHeaders,
      merchantReference: merchantReference as string,
      expectedAmount,
    });

    if (!verifyResult.verified) {
      await this.database.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      if (context) {
        await this.database.auditLog.create({
          data: {
            actorUserId: payment.userId,
            action: "PAYMENT_CALLBACK_FAILED",
            entityType: "Payment",
            entityId: payment.id,
            requestId: context.requestId,
            afterData: { provider, reason: "Signature verification failed" },
          },
        });
      }

      throw new ApiError("CALLBACK_VERIFICATION_FAILED", "Payment signature verification failed.", 400);
    }

    if (verifyResult.normalizedStatus === "SUCCESS") {
      const auditContext: RequestContext = context ?? { requestId: "callback" };

      await this.database.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            callbackVerified: true,
            providerTransactionId: verifyResult.providerTransactionId ?? payment.providerTransactionId,
            paidAt: new Date(),
          },
        });

        const idempotencyKey = `topup-${payment.id}-${payment.userId}`;
        await walletService.credit(
          payment.userId,
          payment.amount,
          "PAYMENT",
          payment.id,
          idempotencyKey,
          `Wallet top-up via ${provider}`,
          { provider, merchantReference },
          auditContext,
          { setInitialTopupDone: !(await tx.user.findUnique({ where: { id: payment.userId }, select: { initialTopupDone: true } }))?.initialTopupDone },
        );
      });

      if (context) {
        await this.database.auditLog.create({
          data: {
            actorUserId: payment.userId,
            action: "PAYMENT_COMPLETED",
            entityType: "Payment",
            entityId: payment.id,
            requestId: context.requestId,
            afterData: {
              provider, amount: payment.amount.toFixed(2),
              providerTransactionId: verifyResult.providerTransactionId,
            },
          },
        });
      }

      return { status: "SUCCESS", paymentId: payment.id, providerTransactionId: verifyResult.providerTransactionId };
    }

    const mappedStatus: "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING" | "REVERSED" = this.mapStatus(verifyResult.normalizedStatus);
    await this.database.payment.update({
      where: { id: payment.id },
      data: { status: mappedStatus },
    });

    if (context) {
      await this.database.auditLog.create({
        data: {
          actorUserId: payment.userId,
          action: "PAYMENT_UPDATED",
          entityType: "Payment",
          entityId: payment.id,
          requestId: context.requestId,
          afterData: {
            provider, status: verifyResult.normalizedStatus,
            providerResponseCode: verifyResult.providerResponseCode,
          },
        },
      });
    }

    return {
      status: verifyResult.normalizedStatus,
      paymentId: payment.id,
      providerTransactionId: verifyResult.providerTransactionId,
    };
  }

  async getPayment(paymentId: string, userId: string) {
    const payment = await this.database.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true, provider: true, amount: true, currency: true, status: true,
        merchantReference: true, providerTransactionId: true, userId: true,
        paidAt: true, createdAt: true, updatedAt: true,
      },
    });
    if (!payment) throw new ApiError("NOT_FOUND", "Payment not found.", 404);
    if (payment.userId !== userId) throw new ApiError("FORBIDDEN", "You do not own this payment.", 403);

    return {
      id: payment.id,
      provider: payment.provider,
      amount: payment.amount.toFixed(2),
      currency: payment.currency,
      status: payment.status,
      merchantReference: payment.merchantReference,
      providerTransactionId: payment.providerTransactionId,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  async listPayments(userId: string, cursor?: string, take = 20) {
    const where = { userId };
    const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];

    const takeLimit = Math.min(take, 100);
    const cursorObj = cursor ? { id: cursor } : undefined;

    const [payments, totalCount] = await Promise.all([
      this.database.payment.findMany({
        where,
        orderBy,
        take: takeLimit + 1,
        ...(cursorObj ? { cursor: cursorObj, skip: 1 } : {}),
        select: {
          id: true, provider: true, amount: true, currency: true, status: true,
          merchantReference: true, createdAt: true,
        },
      }),
      this.database.payment.count({ where }),
    ]);

    const hasMore = payments.length > takeLimit;
    const items = hasMore ? payments.slice(0, takeLimit) : payments;
    const lastItem = items.length > 0 ? items[items.length - 1] : undefined;
    const nextCursor = lastItem?.id ?? null;

    return {
      payments: items.map((p) => ({
        id: p.id,
        provider: p.provider,
        amount: p.amount.toFixed(2),
        currency: p.currency,
        status: p.status,
        merchantReference: p.merchantReference,
        createdAt: p.createdAt.toISOString(),
      })),
      nextCursor,
      totalCount,
    };
  }

  private generateMerchantReference(provider: PaymentProvider): string {
    const prefix = provider === "JAZZCASH" ? "JC" : provider === "EASYPAISA" ? "EP" : "MK";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  private duplicateCallbackResponse(paymentId: string, status: string, provider: PaymentProvider) {
    return { status, paymentId, providerTransactionId: null, duplicate: true };
  }

  private mapStatus(normalized: NormalizedPaymentStatus): "SUCCESS" | "FAILED" | "CANCELLED" | "PENDING" {
    switch (normalized) {
      case "SUCCESS": return "SUCCESS";
      case "FAILED": return "FAILED";
      case "CANCELLED": return "CANCELLED";
      case "PENDING": return "PENDING";
    }
  }
}
