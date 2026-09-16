import type { Request } from "express";

/**
 * Reads a cookie value from the raw Cookie header. The app does not use
 * cookie-parser, so non-JSON cookies are parsed manually.
 */
export function getCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name && rest.length > 0) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return undefined;
}