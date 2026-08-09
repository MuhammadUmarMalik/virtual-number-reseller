import { prisma } from "../config/database.js";
import type { Prisma, TopupStatus } from "@prisma/client";

export const topupRepository = {
  findActivePaymentAccounts() {
    return prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  },

  findPaymentAccountById(id: string) {
    return prisma.paymentAccount.findUnique({ where: { id } });
  },

  listPaymentAccounts(params: { page: number; limit: number }) {
    return prisma.paymentAccount.findMany({
      orderBy: { createdAt: "asc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countPaymentAccounts() {
    return prisma.paymentAccount.count();
  },

  createPaymentAccount(data: Prisma.PaymentAccountUncheckedCreateInput) {
    return prisma.paymentAccount.create({ data });
  },

  updatePaymentAccount(id: string, data: Prisma.PaymentAccountUncheckedUpdateInput) {
    return prisma.paymentAccount.update({ where: { id }, data });
  },

  deletePaymentAccount(id: string) {
    return prisma.paymentAccount.delete({ where: { id } });
  },

  findByRequestCode(requestCode: string) {
    return prisma.topupRequest.findUnique({ where: { requestCode } });
  },

  findByTransactionId(transactionId: string) {
    return prisma.topupRequest.findFirst({ where: { transactionId } });
  },

  createRequest(data: Prisma.TopupRequestUncheckedCreateInput) {
    return prisma.topupRequest.create({
      data,
      include: { paymentAccount: true },
    });
  },

  listByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const where: Prisma.TopupRequestWhereInput = { userId };
    if (params.status) where.status = params.status as TopupStatus;

    return prisma.topupRequest.findMany({
      where,
      include: { paymentAccount: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string, params: { status?: string }) {
    const where: Prisma.TopupRequestWhereInput = { userId };
    if (params.status) where.status = params.status as TopupStatus;

    return prisma.topupRequest.count({ where });
  },

  listAll(params: { page: number; limit: number; status?: string }) {
    const where: Prisma.TopupRequestWhereInput = {};
    if (params.status) where.status = params.status as TopupStatus;

    return prisma.topupRequest.findMany({
      where,
      include: { user: true, paymentAccount: true },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: { status?: string }) {
    const where: Prisma.TopupRequestWhereInput = {};
    if (params.status) where.status = params.status as TopupStatus;

    return prisma.topupRequest.count({ where });
  },

  findById(id: string) {
    return prisma.topupRequest.findUnique({
      where: { id },
      include: { user: true, paymentAccount: true },
    });
  },

  updateStatus(id: string, data: {
    status?: TopupStatus;
    reviewedBy?: string;
    reviewedAt?: Date;
    rejectionReason?: string;
  }) {
    return prisma.topupRequest.update({ where: { id }, data });
  },
};
