import { prisma } from "../config/database.js";

export const sessionRepository = {
  create(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
    ipAddress?: string | null;
  }) {
    return prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      },
    });
  },

  findByRefreshToken(refreshTokenHash: string) {
    return prisma.session.findFirst({ where: { refreshToken: refreshTokenHash } });
  },

  deleteById(id: string) {
    return prisma.session.delete({ where: { id } });
  },
};
