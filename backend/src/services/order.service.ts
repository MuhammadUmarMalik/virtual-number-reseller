import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { orderRepository } from "../repositories/order.repository.js";
import { productRepository } from "../repositories/product.repository.js";
import { createAuditLog, createNotification } from "./audit.service.js";
import { debitWallet } from "./wallet-ops.js";
import { vendorService } from "./vendor.service.js";
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
    if (product.availableStock < input.quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    const quantity = input.quantity;
    const unitPrice = new Prisma.Decimal(product.sellingPrice.toString());
    const total = unitPrice.mul(quantity);
    const subtotal = total;

    const projectId = product.vendorId || env.vendorPid;
    if (!projectId) {
      throw new AppError("Vendor project is not configured for this product", 503);
    }

    let orderCode = generateCode("ORD");
    let attempts = 0;
    while (attempts < 5 && (await orderRepository.findByOrderCode(orderCode))) {
      orderCode = generateCode("ORD");
      attempts += 1;
    }

    const serial = quantity > 1 ? 1 : 2;

    let vendorNumbers;
    try {
      vendorNumbers = await vendorService.purchaseNumbers({
        projectId,
        quantity,
        serial,
      });
    } catch (error) {
      throw error instanceof AppError
        ? error
        : new AppError("Unable to purchase a number right now", 503);
    }

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
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
          items: [
            {
              productId: product.id,
              quantity,
              unitPrice,
              totalPrice: total,
              status: "COMPLETED",
            },
          ],
        });

        const purchasedNumbers: Array<{ id: string; phoneNumber: string }> = [];
        for (const vendorNumber of vendorNumbers) {
          const purchasedNumber = await tx.purchasedNumber.create({
            data: {
              userId,
              orderId: order.id,
              orderItemId: order.items[0].id,
              productId: product.id,
              vendorId: projectId,
              phoneNumber: vendorNumber.phoneNumber,
              vendorOrderId: String(vendorNumber.serial),
              status: "ACTIVE",
              expiresAt: new Date(
                Date.now() + product.refundWindowHours * 60 * 60 * 1000
              ),
            },
          });
          purchasedNumbers.push(purchasedNumber);
        }

        await tx.product.update({
          where: { id: product.id },
          data: { availableStock: { decrement: quantity } },
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
            purchasedNumberCount: purchasedNumbers.length,
          },
        });

        return { order, purchasedNumbers };
      });
    } catch (error) {
      await Promise.allSettled(
        vendorNumbers.map((vendorNumber) =>
          vendorService
            .releaseNumber({
              projectId,
              phoneNumber: vendorNumber.phoneNumber,
              serial: vendorNumber.serial,
            })
            .catch(() => undefined)
        )
      );
      throw error;
    }

    return serializeOrder(result.order);
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
