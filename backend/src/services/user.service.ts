import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "../config/database.js";
import { userRepository } from "../repositories/user.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { AppError } from "../utils/app-error.js";
import { buildPagination } from "../utils/pagination.js";
import type { AuthUser } from "../types/common.types.js";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validators/settings.validator.js";

const BCRYPT_ROUNDS = 10;

function sanitizeUser(user: User): AuthUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export const userService = {
  async getProfile(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return sanitizeUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (input.email && input.email !== user.email) {
      const existing = await userRepository.findByEmail(input.email);
      if (existing && existing.id !== userId) {
        throw new AppError("Email is already in use", 409);
      }
    }

    if (input.whatsappNumber && input.whatsappNumber !== user.whatsappNumber) {
      const existing = await userRepository.findByWhatsappNumber(input.whatsappNumber);
      if (existing && existing.id !== userId) {
        throw new AppError("WhatsApp number is already in use", 409);
      }
    }

    const updated = await userRepository.update(userId, {
      fullName: input.fullName,
      email: input.email,
      whatsappNumber: input.whatsappNumber,
    });

    return sanitizeUser(updated);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new AppError("Current password is incorrect", 400);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    await userRepository.update(userId, { passwordHash });
  },

  async getSessions(userId: string, currentSessionId?: string) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isCurrent: session.id === currentSessionId,
    }));
  },

  async removeSession(userId: string, sessionId: string, currentSessionId?: string) {
    const session = await sessionRepository.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError("Session not found", 404);
    }
    if (session.id === currentSessionId) {
      throw new AppError("Cannot remove the current session", 400);
    }
    await sessionRepository.deleteById(sessionId);
  },

  async listUsers(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { page, limit } = params;
    const [total, users] = await Promise.all([
      userRepository.count(params),
      userRepository.list(params),
    ]);

    return buildPagination(
      users.map((user) => sanitizeUser(user)),
      total,
      { page, limit }
    );
  },
};
