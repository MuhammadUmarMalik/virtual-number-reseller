import { prisma } from "../config/database.js";
import type { NumberStatus, Prisma } from "@prisma/client";

export const numberRepository = {
  listByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const where: Prisma.PurchasedNumberWhereInput = { userId };
    if (params.status) where.status = params.status as NumberStatus;

    return prisma.purchasedNumber.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, service: true, country: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string, params: { status?: string }) {
    const where: Prisma.PurchasedNumberWhereInput = { userId };
    if (params.status) where.status = params.status as NumberStatus;

    return prisma.purchasedNumber.count({ where });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.purchasedNumber.findFirst({
      where: { id, userId },
      include: { product: true },
    });
  },

  findOtpMessages(numberId: string) {
    return prisma.otpMessage.findMany({
      where: { purchasedNumberId: numberId },
      orderBy: { receivedAt: "desc" },
    });
  },

  findByMessageHash(messageHash: string) {
    return prisma.otpMessage.findUnique({ where: { messageHash } });
  },

  createOtpMessage(data: {
    userId: string;
    purchasedNumberId: string;
    vendorMessageId?: string | null;
    service?: string | null;
    rawMessage: string;
    otpCode?: string | null;
    messageHash: string;
  }) {
    return prisma.otpMessage.create({ data });
  },

  updateStatus(id: string, data: {
    status?: NumberStatus;
    otpCount?: number;
    lastCheckedAt?: Date;
  }) {
    return prisma.purchasedNumber.update({ where: { id }, data });
  },

  touchLastChecked(id: string) {
    return prisma.purchasedNumber.update({
      where: { id },
      data: { lastCheckedAt: new Date() },
    });
  },

  listExpired(now: Date) {
    return prisma.purchasedNumber.findMany({
      where: {
        status: { in: ["ACTIVE", "WAITING", "RECEIVED"] },
        expiresAt: { not: null, lt: now },
      },
      select: { id: true },
    });
  },

  markExpired(ids: string[], now: Date) {
    return prisma.purchasedNumber.updateMany({
      where: { id: { in: ids } },
      data: { status: "EXPIRED", lastCheckedAt: now },
    });
  },

  listForOtpPolling(now: Date, limit: number) {
    return prisma.purchasedNumber.findMany({
      where: {
        status: { in: ["ACTIVE", "WAITING", "RECEIVED"] },
        vendorOrderId: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        product: { select: { id: true, vendorId: true, service: true } },
      },
      orderBy: { lastCheckedAt: "asc" },
      take: limit,
    });
  },

  listAll(params: { page: number; limit: number; search?: string; status?: string }) {
    const where: Prisma.PurchasedNumberWhereInput = {};

    if (params.search) {
      where.OR = [
        { phoneNumber: { contains: params.search, mode: "insensitive" } },
        { vendorOrderId: { contains: params.search, mode: "insensitive" } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    if (params.status) where.status = params.status as NumberStatus;

    return prisma.purchasedNumber.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, whatsappNumber: true },
        },
        product: {
          select: { id: true, name: true, service: true, country: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: { search?: string; status?: string }) {
    const where: Prisma.PurchasedNumberWhereInput = {};

    if (params.search) {
      where.OR = [
        { phoneNumber: { contains: params.search, mode: "insensitive" } },
        { vendorOrderId: { contains: params.search, mode: "insensitive" } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
      ];
    }
    if (params.status) where.status = params.status as NumberStatus;

    return prisma.purchasedNumber.count({ where });
  },

  findByIdAdmin(id: string) {
    return prisma.purchasedNumber.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, whatsappNumber: true },
        },
        product: {
          select: { id: true, name: true, service: true, country: true },
        },
        otpMessages: { orderBy: { receivedAt: "desc" }, take: 10 },
      },
    });
  },

  update(id: string, data: Prisma.PurchasedNumberUpdateInput) {
    return prisma.purchasedNumber.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.purchasedNumber.delete({ where: { id } });
  },
};
