import { prisma } from "../config/database.js";
import type { NumberStatus, Prisma } from "@prisma/client";

export const numberRepository = {
  listByUser(userId: string, params: { page: number; limit: number; status?: string; service?: string; country?: string; search?: string }) {
    const where: Prisma.PurchasedNumberWhereInput = buildUserWhere(userId, params);

    return prisma.purchasedNumber.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, service: true, country: true } },
        otpMessages: { orderBy: { receivedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string, params: { status?: string; service?: string; country?: string; search?: string }) {
    return prisma.purchasedNumber.count({ where: buildUserWhere(userId, params) });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.purchasedNumber.findFirst({
      where: { id, userId },
      include: { product: true },
    });
  },

  findByIdForUserDetail(id: string, userId: string) {
    return prisma.purchasedNumber.findFirst({
      where: { id, userId },
      include: {
        product: {
          select: { id: true, name: true, service: true, country: true, countryCode: true },
        },
        otpMessages: { orderBy: { receivedAt: "desc" }, take: 20 },
      },
    });
  },

  findByIdForUserWithEndpoint(id: string, userId: string) {
    return prisma.purchasedNumber.findFirst({
      where: { id, userId },
      include: {
        product: {
          select: { id: true, name: true, service: true, vendorId: true, source: true },
        },
        productNumber: true,
      },
    });
  },

  findLatestOtpMessage(numberId: string) {
    return prisma.otpMessage.findFirst({
      where: { purchasedNumberId: numberId },
      orderBy: { receivedAt: "desc" },
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
    receivedAt?: Date;
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

  listAll(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    country?: string;
    service?: string;
    activationStatus?: string;
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where = buildAdminWhere(params);

    return prisma.purchasedNumber.findMany({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, whatsappNumber: true },
        },
        product: {
          select: { id: true, name: true, service: true, country: true },
        },
        otpMessages: { orderBy: { receivedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: {
    search?: string;
    status?: string;
    country?: string;
    service?: string;
    activationStatus?: string;
    productId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return prisma.purchasedNumber.count({ where: buildAdminWhere(params) });
  },

  findByIdAdmin(id: string) {
    return prisma.purchasedNumber.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, whatsappNumber: true },
        },
        product: {
          select: { id: true, name: true, service: true, country: true, countryCode: true },
        },
        otpMessages: { orderBy: { receivedAt: "desc" }, take: 20 },
      },
    });
  },

  findByActivationId(activationId: string) {
    return prisma.purchasedNumber.findFirst({
      where: { vendorActivationId: activationId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, name: true, service: true } },
      },
    });
  },

  update(id: string, data: Prisma.PurchasedNumberUpdateInput) {
    return prisma.purchasedNumber.update({ where: { id }, data });
  },

  listForSmsbowerPolling(now: Date, limit: number) {
    return prisma.purchasedNumber.findMany({
      where: {
        vendorActivationId: { not: null },
        vendor: "SMSBOWER",
        status: { in: ["ACTIVE", "WAITING"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        activationStatus: { not: "STATUS_CANCEL" },
      },
      include: {
        product: { select: { id: true, service: true, country: true } },
      },
      orderBy: { lastCheckedAt: "asc" },
      take: limit,
    });
  },

  remove(id: string) {
    return prisma.purchasedNumber.delete({ where: { id } });
  },
};

function buildUserWhere(
  userId: string,
  params: { status?: string; service?: string; country?: string; search?: string }
): Prisma.PurchasedNumberWhereInput {
  const where: Prisma.PurchasedNumberWhereInput = { userId };

  if (params.status) where.status = params.status as NumberStatus;
  if (params.service) where.service = params.service;
  if (params.country) where.country = params.country;
  if (params.search) {
    where.OR = [{ phoneNumber: { contains: params.search, mode: "insensitive" } }];
  }
  return where;
}

function buildAdminWhere(params: {
  search?: string;
  status?: string;
  country?: string;
  service?: string;
  activationStatus?: string;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Prisma.PurchasedNumberWhereInput {
  const where: Prisma.PurchasedNumberWhereInput = {};

  if (params.search) {
    where.OR = [
      { phoneNumber: { contains: params.search, mode: "insensitive" } },
      { vendorOrderId: { contains: params.search, mode: "insensitive" } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params.status) where.status = params.status as NumberStatus;
  if (params.country) where.country = params.country;
  if (params.service) where.service = params.service;
  if (params.activationStatus) where.activationStatus = params.activationStatus;
  if (params.productId) where.productId = params.productId;
  if (params.dateFrom || params.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
  }
  return where;
}
