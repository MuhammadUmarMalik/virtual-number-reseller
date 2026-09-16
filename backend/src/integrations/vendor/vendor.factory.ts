import type { NumberVendor } from "./vendor.interface.js";
import { SmsBowerVendor } from "./smsbower/smsbower.mapper.js";
import { env } from "../../config/env.js";

export type VendorName = "SMSBOWER";

const vendors: Record<string, NumberVendor | undefined> = {};

function getVendor(name: string): NumberVendor {
  const existing = vendors[name];
  if (existing) return existing;

  const vendor = createVendor(name);
  vendors[name] = vendor;
  return vendor;
}

function createVendor(name: string): NumberVendor {
  switch (name) {
    case "SMSBOWER":
      if (!env.smsbowerApiKey) {
        throw new Error("SMSBOWER_API_KEY is not configured");
      }
      return new SmsBowerVendor();
    default:
      throw new Error(`Unknown vendor: ${name}`);
  }
}

export function resolveVendor(name: string | undefined | null): NumberVendor {
  const vendorName = name && name.trim() !== "" ? name : "SMSBOWER";
  return getVendor(vendorName);
}

export function isVendorConfigured(name: string): boolean {
  switch (name) {
    case "SMSBOWER":
      return Boolean(env.smsbowerApiKey);
    default:
      return false;
  }
}
