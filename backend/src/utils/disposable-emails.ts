import { isValid as isMailValid } from "mailchecker";
import { AppError } from "./app-error.js";

// Domains temporarily not covered by the maintained mailchecker list.
const EXTRA_DISPOSABLE_DOMAINS = new Set(["duidir.com"]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!(domain && EXTRA_DISPOSABLE_DOMAINS.has(domain)) || !isMailValid(email);
}

export function assertNotDisposableEmail(email: string): void {
  if (isDisposableEmail(email)) {
    throw new AppError("Disposable email addresses are not allowed", 422);
  }
}