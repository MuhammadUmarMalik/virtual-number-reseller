import type { Role, UserStatus } from "@prisma/client";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
