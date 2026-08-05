import { apiClient } from "@/lib/api-client";
import { getRefreshToken } from "@/lib/auth-storage";
import type {
  AuthResponse,
  AuthUser,
  SignInPayload,
  SignUpPayload,
} from "@/types/auth.types";

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiClient<AuthUser>("/auth/me");
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  return apiClient<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}
