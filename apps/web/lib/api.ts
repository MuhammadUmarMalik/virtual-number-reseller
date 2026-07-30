export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: { fieldErrors?: Record<string, string[]> } | null };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });
  const body = (await response.json()) as { success: true; data: T } | ApiErrorBody;
  if (!response.ok || !body.success) {
    const error = new Error(body.success ? "Request failed." : body.error.message) as Error & {
      code?: string;
      fields?: Record<string, string[]> | undefined;
    };
    if (!body.success) {
      error.code = body.error.code;
      error.fields = body.error.details?.fieldErrors;
    }
    throw error;
  }
  return body.data;
}

export function safeRedirect(value: string | undefined, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
