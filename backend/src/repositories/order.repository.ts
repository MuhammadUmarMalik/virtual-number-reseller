import { prisma } from "../config/database.js";
import type { OrderItemStatus, OrderStatus, Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export const orderRepository = {
  findByOrderCode(orderCode: string) {
    return prisma.order.findUnique({ where: { orderCode } });
  },

  findById(id: string, includeUser = false) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        numbers: { orderBy: { createdAt: "asc" } },
        ...(includeUser ? { user: true } : {}),
      },
    });
  },

  listByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const where: Prisma.OrderWhereInput = { userId };
    if (params.status) where.status = params.status as OrderStatus;

    return prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        numbers: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string, params: { status?: string }) {
    const where: Prisma.OrderWhereInput = { userId };
    if (params.status) where.status = params.status as OrderStatus;

    return prisma.order.count({ where });
  },

  listAll(params: { page: number; limit: number; status?: string; userId?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status as OrderStatus;
    if (params.userId) where.userId = params.userId;

    return prisma.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: { status?: string; userId?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status as OrderStatus;
    if (params.userId) where.userId = params.userId;

    return prisma.order.count({ where });
  },

  createWithItems(tx: Tx, data: {
    orderCode: string;
    userId: string;
    subtotal: Prisma.Decimal;
    total: Prisma.Decimal;
    status: OrderStatus;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
      status: OrderItemStatus;
    }>;
  }) {
    return tx.order.create({
      data: {
        orderCode: data.orderCode,
        userId: data.userId,
        subtotal: data.subtotal,
        total: data.total,
        status: data.status,
        completedAt: data.status === "COMPLETED" ? new Date() : null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            status: item.status,
          })),
        },
      },
      include: { items: true },
    });
  },

  updateStatus(id: string, data: {
    status?: OrderStatus;
    failureReason?: string | null;
    completedAt?: Date;
  }) {
    return prisma.order.update({ where: { id }, data });
  },
};
