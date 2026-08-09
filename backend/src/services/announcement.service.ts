import { announcementRepository } from "../repositories/announcement.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { CreateAnnouncementInput } from "../validators/announcement.validator.js";

export const announcementService = {
  async listPublished(params: { page: number; limit: number }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      announcementRepository.countPublished(),
      announcementRepository.listPublished(params),
    ]);

    return buildPagination(items, total, { page, limit });
  },

  async listAll(params: { page: number; limit: number; type?: string }) {
    const { page, limit } = params;
    const [total, items] = await Promise.all([
      announcementRepository.countAll(params),
      announcementRepository.listAll(params),
    ]);

    return buildPagination(items, total, { page, limit });
  },

  async create(input: CreateAnnouncementInput) {
    return announcementRepository.create({
      ...input,
      publishedAt: input.publishedAt ?? (input.isPublished ? new Date() : null),
    });
  },

  async update(announcementId: string, input: Partial<CreateAnnouncementInput>) {
    const existing = await announcementRepository.findById(announcementId);
    if (!existing) {
      throw new AppError("Announcement not found", 404);
    }

    return announcementRepository.update(announcementId, {
      ...input,
      publishedAt:
        input.publishedAt !== undefined
          ? input.publishedAt
          : input.isPublished === true && existing.publishedAt === null
            ? new Date()
            : existing.publishedAt,
    });
  },

  async remove(announcementId: string) {
    const existing = await announcementRepository.findById(announcementId);
    if (!existing) {
      throw new AppError("Announcement not found", 404);
    }
    await announcementRepository.delete(announcementId);
  },
};
