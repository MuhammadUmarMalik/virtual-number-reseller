import { apiClient } from "@/lib/api-client";
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

/**
 * Verifies the session during app bootstrap. Runs without the auth-failure
 * redirect so anonymous visitors are never yanked away from public pages.
 */
export async function verifySession(): Promise<AuthUser | null> {
  try {
    return await apiClient<AuthUser>("/auth/me", undefined, { skipAuthRedirect: true });
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  // The refresh token is an HttpOnly cookie; the backend revokes it.
  return apiClient<void>("/auth/logout", {
    method: "POST",
  });
}
