import { notificationRepository } from "../repositories/notification.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";

export const notificationService = {
  async listNotifications(userId: string, params: { page: number; limit: number }) {
    const [total, items] = await Promise.all([
      notificationRepository.countByUser(userId),
      notificationRepository.listByUser(userId, params),
    ]);

    return buildPagination(items, total, params);
  },

  async markRead(userId: string, notificationId: string) {
    const notification = await notificationRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new AppError("Notification not found", 404);
    }
    return notificationRepository.update(notificationId, { isRead: true });
  },

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  },

  async getUnreadCount(userId: string) {
    return notificationRepository.countUnreadByUser(userId);
  },
};
