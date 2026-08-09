import { prisma } from "../config/database.js";
import type { Prisma, RefundStatus } from "@prisma/client";

export const refundRepository = {
  findByOrderId(orderId: string, userId: string) {
    return prisma.refundRequest.findFirst({ where: { orderId, userId } });
  },

  create(data: Prisma.RefundRequestUncheckedCreateInput) {
    return prisma.refundRequest.create({
      data,
      include: { order: true },
    });
  },

  listByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const where: Prisma.RefundRequestWhereInput = { userId };
    if (params.status) where.status = params.status as RefundStatus;

    return prisma.refundRequest.findMany({
      where,
      include: { order: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string, params: { status?: string }) {
    const where: Prisma.RefundRequestWhereInput = { userId };
    if (params.status) where.status = params.status as RefundStatus;

    return prisma.refundRequest.count({ where });
  },

  listAll(params: { page: number; limit: number; status?: string }) {
    const where: Prisma.RefundRequestWhereInput = {};
    if (params.status) where.status = params.status as RefundStatus;

    return prisma.refundRequest.findMany({
      where,
      include: { order: true, user: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: { status?: string }) {
    const where: Prisma.RefundRequestWhereInput = {};
    if (params.status) where.status = params.status as RefundStatus;

    return prisma.refundRequest.count({ where });
  },

  findById(id: string) {
    return prisma.refundRequest.findUnique({
      where: { id },
      include: { order: true, user: true },
    });
  },

  updateStatus(id: string, data: {
    status?: RefundStatus;
    reviewedBy?: string;
    reviewedAt?: Date;
    adminNotes?: string;
  }) {
    return prisma.refundRequest.update({ where: { id }, data });
  },
};
