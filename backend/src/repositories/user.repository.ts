import { prisma } from "../config/database.js";
import type { Prisma, Role, UserStatus } from "@prisma/client";

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findByWhatsappNumber(whatsappNumber: string) {
    return prisma.user.findUnique({ where: { whatsappNumber } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  updateLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },

  list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { whatsappNumber: { contains: params.search } },
      ];
    }
    if (params.status) {
      where.status = params.status as UserStatus;
    }
    if (params.role) {
      where.role = params.role as Role;
    }

    return prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  count(params: { search?: string; status?: string; role?: string }) {
    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
        { whatsappNumber: { contains: params.search } },
      ];
    }
    if (params.status) {
      where.status = params.status as UserStatus;
    }
    if (params.role) {
      where.role = params.role as Role;
    }

    return prisma.user.count({ where });
  },
};
