export function toSingle(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value[0] as string | undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

export function paramString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}
