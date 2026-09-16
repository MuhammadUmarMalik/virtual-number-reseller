import { extractOtp } from "../../utils/otp-parser.js";
import type {
  GetMobileCodeResult,
  GetMobileResult,
  VendorNumber,
  VendorSmsMessage,
} from "./vendor.types.js";

export function mapMobileNumbers(
  result: GetMobileResult,
  serial: number
): VendorNumber[] {
  const numbers = Array.isArray(result) ? result : [result];
  return numbers
    .filter((number) => typeof number === "string" && number.trim() !== "")
    .map((phoneNumber) => ({ phoneNumber, serial }));
}

export function mapMobileCodeNumbers(
  result: GetMobileCodeResult,
  serial: number
): VendorNumber[] {
  const entries = Array.isArray(result) ? result : [result];
  const numbers: VendorNumber[] = [];
  for (const entry of entries) {
    // Format is "+59173841704,+591"
    const parts = entry.split(",");
    const phoneNumber = parts[0]?.trim();
    if (phoneNumber) {
      numbers.push({ phoneNumber, serial });
    }
  }
  return numbers;
}

export function parseSmsMessages(raw: string): VendorSmsMessage[] {
  if (!raw) return [];
  // Multi-number response is semicolon-delimited: "Project name:123456;Project name:123456;"
  if (raw.includes(";")) {
    return raw
      .split(";")
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        const parts = segment.split(":");
        const code = parts[parts.length - 1]?.trim() ?? "";
        return { rawMessage: segment, otpCode: code || (extractOtp(segment) ?? "") };
      });
  }
  return [{ rawMessage: raw, otpCode: extractOtp(raw) ?? raw.trim() }];
}
