import type { Request, Response } from "express";
import { notificationService } from "../services/notification.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString } from "../utils/query.js";

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await notificationService.listNotifications(
      req.user!.id,
      parsePagination(req.query)
    );
    res.json(successResponse("Notifications retrieved", data));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(req.user!.id, paramString(req.params.notificationId));
    res.json(successResponse("Notification marked as read"));
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    res.json(successResponse("All notifications marked as read"));
  }),

  unreadCount: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json(successResponse("Unread count retrieved", { count }));
  }),
};
