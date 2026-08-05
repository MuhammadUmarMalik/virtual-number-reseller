export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BLOCKED";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  whatsappNumber: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  fullName: string;
  email: string;
  whatsappNumber: string;
  password: string;
}
