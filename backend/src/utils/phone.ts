export function normalizePhoneNumber(value: string): string {
  return value.trim().replace(/[\s-()]/g, "");
}

export function normalizeDialCode(value: string): string {
  return value.trim().replace(/^\+/, "").replace(/[\s-()]/g, "");
}

export function isValidE164Number(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

export function matchesDialCode(phoneNumber: string, dialCode: string): boolean {
  const dial = normalizeDialCode(dialCode);
  if (!dial) return true;
  return normalizePhoneNumber(phoneNumber).replace(/^\+/, "").startsWith(dial);
}