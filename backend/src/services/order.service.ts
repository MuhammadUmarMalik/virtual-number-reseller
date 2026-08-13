import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { orderRepository } from "../repositories/order.repository.js";
import { numberRepository } from "../repositories/number.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { syncNumberOtps } from "./number.service.js";
import { logger } from "../config/logger.js";
import { debitWallet } from "./wallet-ops.js";
import { vendorService } from "./vendor.service.js";
import { liveStockService } from "./live-stock.service.js";
import { realtime } from "../realtime/events.js";
import { AppError } from "../utils/app-error.js";
import { generateCode } from "../utils/generate-code.js";
import { buildPagination } from "../utils/pagination.js";
import type { CreateOrderInput } from "../validators/order.validator.js";

function toString(value: { toString(): string }): string {
  return value.toString();
}

interface SerializedOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  status: string;
  otpCount: number;
  createdAt: string;
  product?: unknown;
}

interface SerializedOrder {
  id: string;
  orderCode: string;
  userId: string;
  subtotal: string;
  total: string;
  status: string;
  failureReason: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: SerializedOrderItem[];
  numbers?: unknown[];
  user?: unknown;
}

function serializeOrder(order: {
  subtotal: { toString(): string };
  total: { toString(): string };
  items?: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: { toString(): string };
    totalPrice: { toString(): string };
    status: string;
    otpCount: number;
    createdAt: Date;
    product?: unknown;
  }>;
  numbers?: Array<{
    id: string;
    userId: string;
    orderId: string;
    orderItemId: string | null;
    productId: string;
    vendorId: string | null;
    phoneNumber: string;
    vendorOrderId: string | null;
    status: string;
    otpCount: number;
    purchasedAt: Date;
    expiresAt: Date | null;
    lastCheckedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  failureReason?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
} & Record<string, unknown>): SerializedOrder {
  return {
    ...order,
    subtotal: toString(order.subtotal),
    total: toString(order.total),
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    failureReason: order.failureReason ?? null,
    items: order.items?.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: toString(item.unitPrice),
      totalPrice: toString(item.totalPrice),
      status: item.status,
      otpCount: item.otpCount,
      createdAt: item.createdAt.toISOString(),
      ...(item.product ? { product: item.product } : {}),
    })),
    numbers: order.numbers?.map((number) => ({
      ...number,
      purchasedAt: number.purchasedAt.toISOString(),
      expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
      lastCheckedAt: number.lastCheckedAt
        ? number.lastCheckedAt.toISOString()
        : null,
      createdAt: number.createdAt.toISOString(),
      updatedAt: number.updatedAt.toISOString(),
    })),
  } as unknown as SerializedOrder;
}

export const orderService = {
  async createOrder(userId: string, input: CreateOrderInput) {
    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    if (product.status !== "ACTIVE") {
      throw new AppError("This product is not available", 400);
    }
    if (product.needsSync) {
      throw new AppError(
        "This product is flagged for re-sync and cannot be purchased until an admin fixes its vendor country mapping.",
        409
      );
    }

    const quantity = input.quantity;

    const liveStock = await liveStockService.getLiveStock({
      id: product.id,
      vendor: product.vendor,
      service: product.service,
      countryCode: product.countryCode,
      vendorCountryId: product.vendorCountryId,
      vendorProviderId: product.vendorProviderId,
      vendorId: product.vendorId,
      vip: product.vip,
      needsSync: product.needsSync,
    });

    if (liveStock !== null && liveStock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    if (liveStock === null && product.availableStock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }
    const unitPrice = new Prisma.Decimal(product.sellingPrice.toString());
    const total = unitPrice.mul(quantity);
    const subtotal = total;

    const vendorName = product.vendor || "SMSBOWER";

    const idempotencyKey = input.idempotencyKey?.trim();
    if (idempotencyKey) {
      const existing = await orderRepository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        if (existing.userId !== userId) {
          throw new AppError("Invalid idempotency key", 400);
        }
        const order = await orderRepository.findById(existing.id);
        if (order) return serializeOrder(order);
      }
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    });
    if (!wallet || new Prisma.Decimal(wallet.balance.toString()).lt(total)) {
      throw new AppError("Insufficient wallet balance", 400);
    }

    let orderCode = generateCode("ORD");
    let attempts = 0;
    while (attempts < 5 && (await orderRepository.findByOrderCode(orderCode))) {
      orderCode = generateCode("ORD");
      attempts += 1;
    }

    const numberLifetimeMs = env.numberLifetimeMinutes * 60 * 1000;

    if (vendorName !== "SMSBOWER") {
      throw new AppError(
        `Vendor ${vendorName} is not supported. Only SMSBower purchases are available.`,
        400
      );
    }

    const result = await this.purchaseWithSmsBower({
      userId,
      product,
      quantity,
      subtotal,
      total,
      orderCode,
      idempotencyKey,
      numberLifetimeMs,
      vendorName,
    });

    realtime.emitToUser(userId, "order", {
      orderId: result.order.id,
      orderCode: result.order.orderCode,
      total: toString(total),
      purchasedNumberCount: result.purchasedNumbers.length,
    });

    return {
      ...serializeOrder(result.order),
      numbers: result.purchasedNumbers.map((number) => ({
        id: number.id,
        orderId: number.orderId,
        orderItemId: number.orderItemId,
        productId: number.productId,
        vendorId: number.vendorId,
        phoneNumber: number.phoneNumber,
        vendorOrderId: number.vendorOrderId,
        vendorActivationId: number.vendorActivationId,
        vendorCost: number.vendorCost?.toString() ?? null,
        vendorOperator: number.vendorOperator,
        canGetAnotherSms: number.canGetAnotherSms,
        status: number.status,
        otpCount: number.otpCount,
        purchasedAt: number.purchasedAt.toISOString(),
        expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
        lastCheckedAt: number.lastCheckedAt
          ? number.lastCheckedAt.toISOString()
          : null,
        createdAt: number.createdAt.toISOString(),
        updatedAt: number.updatedAt.toISOString(),
        product: {
          id: product.id,
          name: product.name,
          service: product.service,
          country: product.countryCode,
          sellingPrice: product.sellingPrice.toString(),
        },
      })),
    } as unknown as SerializedOrder;
  },

  async purchaseWithSmsBower(params: {
    userId: string;
    product: { id: string; vendorId: string | null; vendorCountryId: string | null; vendorProviderId: string | null; needsSync: boolean; countryCode: string; service: string; name: string; sellingPrice: { toString(): string }; vendorCost: { toString(): string } };
    quantity: number;
    subtotal: Prisma.Decimal;
    total: Prisma.Decimal;
    orderCode: string;
    idempotencyKey?: string;
    numberLifetimeMs: number;
    vendorName: string;
  }) {
    const { userId, product, quantity, subtotal, total, orderCode, idempotencyKey, numberLifetimeMs } = params;

    if (product.needsSync) {
      throw new AppError(
        "This product is flagged for re-sync and cannot be purchased until an admin fixes its vendor country mapping.",
        409
      );
    }
    const vendorCountryId = (product.vendorCountryId ?? product.countryCode ?? "").trim();
    if (!/^\d+$/.test(vendorCountryId)) {
      throw new AppError(
        "This product has an invalid vendor country mapping and cannot be purchased. An admin must re-sync it.",
        409
      );
    }

    let activation;
    try {
      activation = await vendorService.vendorRouter.purchase({
        vendor: "SMSBOWER",
        country: vendorCountryId,
        service: product.service,
        quantity,
        providerId: product.vendorProviderId ?? undefined,
      });
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError("Unable to purchase a number right now", 503);
    }

    const projectId = product.vendorId;

    const result = await prisma.$transaction(async (tx) => {
      const stockClaimed = await tx.product.updateMany({
        where: { id: product.id, availableStock: { gte: quantity } },
        data: { availableStock: { decrement: quantity } },
      });
      if (stockClaimed.count === 0) {
        throw new AppError("Insufficient stock", 400);
      }

      await debitWallet(tx, {
        userId,
        amount: total,
        type: "PURCHASE",
        referenceType: "ORDER",
        description: `Order ${orderCode}`,
      });

      const order = await orderRepository.createWithItems(tx, {
        orderCode,
        userId,
        subtotal,
        total,
        status: "COMPLETED",
        idempotencyKey,
        vendor: "SMSBOWER",
        vendorActivationId: activation.vendorActivationId,
        items: [
          {
            productId: product.id,
            quantity,
            unitPrice: total.div(quantity),
            totalPrice: total,
            status: "COMPLETED",
          },
        ],
      });

      const purchasedNumber = await tx.purchasedNumber.create({
        data: {
          userId,
          orderId: order.id,
          orderItemId: order.items[0].id,
          productId: product.id,
          vendor: "SMSBOWER",
          vendorId: projectId,
          phoneNumber: activation.phoneNumber,
          vendorActivationId: activation.vendorActivationId,
          vendorCost: new Prisma.Decimal(activation.cost || "0"),
          vendorOperator: activation.operator,
          canGetAnotherSms: activation.canGetAnotherSms,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + numberLifetimeMs),
        },
      });

      await createNotification(tx, {
        userId,
        title: "Order placed",
        message: `Order ${orderCode} for ${product.name} (x${quantity}) is confirmed.`,
        type: "ORDER",
      });

      await createAuditLog(tx, {
        adminId: userId,
        action: "ORDER_CREATE",
        entityType: "Order",
        entityId: order.id,
        newValue: {
          orderCode,
          total: toString(total),
          purchasedNumberCount: 1,
          vendor: "SMSBOWER",
        },
      });

      return { order, purchasedNumbers: [purchasedNumber] };
    });

    return result;
  },

  async listOrders(userId: string, params: { page: number; limit: number; status?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      orderRepository.countByUser(userId, params),
      orderRepository.listByUser(userId, params),
    ]);

    return buildPagination(items.map(serializeOrder), total, { page, limit });
  },

  async getOrder(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }
    return serializeOrder(order);
  },

  async getOrderStatus(userId: string, orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new AppError("Order not found", 404);
    }

    for (const number of order.numbers ?? []) {
      if (number.expiresAt && number.expiresAt.getTime() <= Date.now()) {
        continue;
      }
      if (!["WAITING", "ACTIVE", "RECEIVED"].includes(number.status)) {
        continue;
      }

      const fresh = await numberRepository.findByIdForUser(number.id, userId);
      if (!fresh) continue;

      try {
        await syncNumberOtps({
          id: fresh.id,
          userId: fresh.userId,
          phoneNumber: fresh.phoneNumber,
          vendorOrderId: fresh.vendorOrderId,
          vendorActivationId: fresh.vendorActivationId,
          vendor: fresh.vendor,
          status: fresh.status,
          otpCount: fresh.otpCount,
          expiresAt: fresh.expiresAt,
          lastCheckedAt: fresh.lastCheckedAt,
          product: fresh.product
            ? {
                vendorId: fresh.product.vendorId,
                service: fresh.product.service,
                vendor: fresh.product.vendor,
              }
            : null,
        });
      } catch (error) {
        // A transient vendor outage must not break the polling endpoint.
        logger.warn(`OTP poll failed for number ${number.id}`, error);
      }
    }

    const freshOrder = await orderRepository.findById(orderId);
    if (!freshOrder) {
      throw new AppError("Order not found", 404);
    }

    const numbers = await Promise.all(
      (freshOrder.numbers ?? []).map(async (number) => {
        const messages = await numberRepository.findOtpMessages(number.id);
        return {
          id: number.id,
          phoneNumber: number.phoneNumber,
          status: number.status,
          otpCount: number.otpCount,
          expiresAt: number.expiresAt ? number.expiresAt.toISOString() : null,
          otpCode: messages[0]?.otpCode ?? null,
          otps: messages.map((message) => ({
            id: message.id,
            otpCode: message.otpCode,
            rawMessage: message.rawMessage,
            receivedAt: message.receivedAt.toISOString(),
          })),
        };
      })
    );

    return {
      orderId: freshOrder.id,
      orderCode: freshOrder.orderCode,
      status: freshOrder.status,
      completedAt: freshOrder.completedAt
        ? freshOrder.completedAt.toISOString()
        : null,
      numbers,
    };
  },

  async listAll(params: { page: number; limit: number; status?: string; userId?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      orderRepository.countAll(params),
      orderRepository.listAll(params),
    ]);

    return buildPagination(items.map(serializeOrder), total, { page, limit });
  },

  async getOrderAdmin(orderId: string) {
    const order = await orderRepository.findById(orderId, true);
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    return serializeOrder(order);
  },
};
