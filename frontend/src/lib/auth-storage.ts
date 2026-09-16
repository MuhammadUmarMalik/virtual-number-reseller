/**
 * Token storage. The refresh token lives only in an HttpOnly cookie set by
 * the backend; it is never readable from client-side JavaScript. The access
 * token is kept in memory for the current SPA session so it can be sent as a
 * Bearer header, and is also mirrored to an HttpOnly cookie by the backend so
 * a page reload re-authenticates without re-login. No tokens are persisted in
 * localStorage, which would expose them to any XSS payload.
 */
let accessToken: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  return isBrowser() ? accessToken : null;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAuthStorage(): void {
  accessToken = null;
}