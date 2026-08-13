export function mapVendorFlagToBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized === "") return false;
    return normalized === "1" || normalized.toLowerCase() === "true";
  }
  return null;
}

export function normalizePhoneNumber(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().replace(/^\+/, "");
}

export function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}
