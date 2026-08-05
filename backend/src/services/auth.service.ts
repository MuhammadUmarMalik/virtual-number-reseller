import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { sessionRepository } from "../repositories/session.repository.js";
import { AppError } from "../utils/app-error.js";
import type { AuthResponse, AuthTokens, AuthUser } from "../types/common.types.js";
import type { SignInInput, SignUpInput } from "../validators/auth.validator.js";

const BCRYPT_ROUNDS = 10;

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sanitizeUser(user: User): AuthUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

function generateAccessToken(userId: string): string {
  const options: SignOptions = {
    expiresIn: env.accessTokenExpiry as SignOptions["expiresIn"],
    issuer: env.jwtIssuer,
  };
  return jwt.sign({ sub: userId }, env.accessTokenSecret, options);
}

function generateRefreshToken(): string {
  return randomBytes(48).toString("hex");
}

async function issueTokens(user: User): Promise<AuthTokens> {
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + env.refreshTokenExpiryDays * 24 * 60 * 60 * 1000
  );

  await sessionRepository.create({
    userId: user.id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async signUp(input: SignUpInput): Promise<AuthResponse> {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new AppError("Email is already registered", 409);
    }

    const existingWhatsapp = await userRepository.findByWhatsappNumber(input.whatsappNumber);
    if (existingWhatsapp) {
      throw new AppError("WhatsApp number is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.email,
          whatsappNumber: input.whatsappNumber,
          passwordHash,
        },
      });
      await tx.wallet.create({
        data: { userId: created.id },
      });
      return created;
    });

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), tokens };
  },

  async signIn(input: SignInInput): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Your account is suspended or blocked", 403);
    }

    await userRepository.updateLastLogin(user.id);
    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), tokens };
  },

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return sanitizeUser(user);
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await sessionRepository.findByRefreshToken(refreshTokenHash);
    if (!session) {
      throw new AppError("Invalid refresh token", 401);
    }
    if (session.expiresAt < new Date()) {
      await sessionRepository.deleteById(session.id);
      throw new AppError("Refresh token expired", 401);
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw new AppError("User not found", 401);
    }
    if (user.status !== "ACTIVE") {
      throw new AppError("Your account is suspended or blocked", 403);
    }

    await sessionRepository.deleteById(session.id);
    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), tokens };
  },

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const session = await sessionRepository.findByRefreshToken(refreshTokenHash);
    if (session) {
      await sessionRepository.deleteById(session.id);
    }
  },
};
