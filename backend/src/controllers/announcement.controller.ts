import type { Request, Response } from "express";
import { announcementService } from "../services/announcement.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { parsePagination } from "../utils/pagination.js";
import { paramString, toSingle } from "../utils/query.js";

export const announcementController = {
  listPublished: asyncHandler(async (req: Request, res: Response) => {
    const data = await announcementService.listPublished(parsePagination(req.query));
    res.json(successResponse("Announcements retrieved", data));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await announcementService.create(req.body);
    res.status(201).json(successResponse("Announcement created", data));
  }),

  listAll: asyncHandler(async (req: Request, res: Response) => {
    const data = await announcementService.listAll({
      ...parsePagination(req.query),
      type: toSingle(req.query.type),
    });
    res.json(successResponse("Announcements retrieved", data));
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await announcementService.update(paramString(req.params.announcementId), req.body);
    res.json(successResponse("Announcement updated", data));
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await announcementService.remove(paramString(req.params.announcementId));
    res.json(successResponse("Announcement deleted"));
  }),
};
