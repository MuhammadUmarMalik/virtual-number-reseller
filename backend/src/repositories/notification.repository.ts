import { prisma } from "../config/database.js";
import type { Prisma } from "@prisma/client";

export const notificationRepository = {
  listByUser(userId: string, params: { page: number; limit: number }) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countByUser(userId: string) {
    return prisma.notification.count({ where: { userId } });
  },

  countUnreadByUser(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },

  update(id: string, data: Prisma.NotificationUpdateInput) {
    return prisma.notification.update({ where: { id }, data });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
