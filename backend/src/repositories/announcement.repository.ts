import { prisma } from "../config/database.js";
import type { Prisma, AnnouncementType } from "@prisma/client";

export const announcementRepository = {
  listPublished(params: { page: number; limit: number }) {
    return prisma.announcement.findMany({
      where: {
        isPublished: true,
        OR: [
          { publishedAt: null },
          { publishedAt: { lte: new Date() } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countPublished() {
    return prisma.announcement.count({
      where: {
        isPublished: true,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
    });
  },

  listAll(params: { page: number; limit: number; type?: string }) {
    const where: Prisma.AnnouncementWhereInput = {};
    if (params.type) where.type = params.type as AnnouncementType;

    return prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    });
  },

  countAll(params: { type?: string }) {
    const where: Prisma.AnnouncementWhereInput = {};
    if (params.type) where.type = params.type as AnnouncementType;

    return prisma.announcement.count({ where });
  },

  findById(id: string) {
    return prisma.announcement.findUnique({ where: { id } });
  },

  create(data: Prisma.AnnouncementUncheckedCreateInput) {
    return prisma.announcement.create({ data });
  },

  update(id: string, data: Prisma.AnnouncementUncheckedUpdateInput) {
    return prisma.announcement.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.announcement.delete({ where: { id } });
  },
};
