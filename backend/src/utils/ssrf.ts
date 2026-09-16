import { lookup } from "node:dns/promises";
import { isIP, isIPv4, isIPv6 } from "node:net";
import type { LookupAddress } from "node:dns";
import { AppError } from "./app-error.js";

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => octet < 0 || octet > 255)) {
    return false;
  }
  const [a, b, c] = octets;

  if (a === 0) return true;
  if (a === 10) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local / metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0 && c === 0) return true;
  if (a === 192 && b === 0 && c === 2) return true; // TEST-NET
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function extractMappedIpv4(address: string): string | null {
  // "::ffff:192.168.0.1" surfaces as an IPv6 literal in some resolvers.
  const match = address.toLowerCase().match(/^::ffff:(?:0+:)??(\d+\.\d+\.\d+\.\d+)$/);
  return match ? match[1] : null;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) return true; // link-local
  if (normalized.startsWith("ff")) return true; // multicast
  if (normalized.startsWith("2001:db8")) return true; // documentation
  if (normalized.startsWith("100:")) return true; // discard-only
  const mapped = extractMappedIpv4(address);
  if (mapped) return isPrivateIpv4(mapped);
  return false;
}

export function isPrivateIp(address: string): boolean {
  if (isIPv4(address)) return isPrivateIpv4(address);
  if (isIPv6(address)) return isPrivateIpv6(address);
  return false;
}

/**
 * Validates and returns a provider endpoint URL that the server is allowed to
 * call. Rejects non-HTTPS URLs, URLs with embedded credentials, and hosts that
 * resolve to private or reserved IP ranges (SSRF protection).
 */
export async function assertSafeProviderUrl(raw: string): Promise<string> {
  const trimmed = raw.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError("Invalid provider endpoint URL", 400);
  }

  if (url.protocol !== "https:") {
    throw new AppError("Provider endpoint must use HTTPS", 400);
  }
  if (url.username || url.password) {
    throw new AppError("Provider endpoint must not contain credentials", 400);
  }
  if (!url.hostname) {
    throw new AppError("Provider endpoint is missing a host", 400);
  }

  const host = url.hostname;
  if (isIP(host)) {
    if (isPrivateIp(host)) {
      throw new AppError("Provider endpoint resolves to a private address", 400);
    }
    return url.toString();
  }

  let addresses: LookupAddress[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new AppError("Provider endpoint host cannot be resolved", 400);
  }
  if (addresses.length === 0 || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new AppError("Provider endpoint resolves to a private address", 400);
  }
  return url.toString();
}