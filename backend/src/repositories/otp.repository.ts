import { prisma } from "../config/database.js";
import type { Prisma } from "@prisma/client";

export interface OtpHistoryParams {
  page: number;
  limit: number;
  userId?: string;
  number?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const otpRepository = {
  list(params: OtpHistoryParams) {
    const where = buildWhere(params);

    return prisma.otpMessage.findMany({
      where,
      include: {
        purchasedNumber: { select: { id: true, phoneNumber: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  count(params: OtpHistoryParams) {
    return prisma.otpMessage.count({ where: buildWhere(params) });
  },

  findById(id: string, userId?: string) {
    return prisma.otpMessage.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      include: {
        purchasedNumber: { select: { id: true, phoneNumber: true } },
      },
    });
  },
};

function buildWhere(params: OtpHistoryParams): Prisma.OtpMessageWhereInput {
  const where: Prisma.OtpMessageWhereInput = {};
  if (params.userId) where.userId = params.userId;
  if (params.service) where.service = params.service;

  if (params.number) {
    where.purchasedNumber = { phoneNumber: { contains: params.number } };
  }

  if (params.dateFrom || params.dateTo) {
    where.receivedAt = {};
    if (params.dateFrom) where.receivedAt.gte = new Date(params.dateFrom);
    if (params.dateTo) where.receivedAt.lte = new Date(params.dateTo);
  }

  return where;
}
