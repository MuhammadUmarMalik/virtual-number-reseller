import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";
import { useAuthStore } from "@/store/auth.store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api/v1";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

interface AuthTokensPayload {
  user: unknown;
  tokens: { accessToken: string; refreshToken: string };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly errors: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.success === "boolean" &&
    typeof response.message === "string"
  );
}

// Single-flight refresh: concurrent 401s share one refresh request.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok || !isApiResponse<AuthTokensPayload>(body) || !body.success) {
      return false;
    }

    const tokens = body.data?.tokens;
    if (!tokens?.accessToken || !tokens.refreshToken) return false;

    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function handleAuthFailure(): void {
  clearAuthStorage();
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith("/sign-in") && !currentPath.startsWith("/sign-up")) {
      const redirectPath = encodeURIComponent(currentPath);
      // Non-component module: full-page redirect is required (SSE tokens, stale auth).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(
        `${window.location.origin}/sign-in?redirect=${redirectPath}`
      );
    }
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  internal?: { retried?: boolean }
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please try again.", 0);
  }

  if (
    response.status === 401 &&
    path !== "/auth/refresh" &&
    path !== "/auth/sign-in" &&
    path !== "/auth/sign-up" &&
    !internal?.retried
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiClient<T>(path, options, { retried: true });
    }
    handleAuthFailure();
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok || !isApiResponse<T>(body) || !body.success) {
    throw new ApiError(
      isApiResponse<unknown>(body) ? body.message : "Request failed",
      response.status,
      isApiResponse<unknown>(body) ? body.errors : undefined
    );
  }

  return body.data as T;
}
