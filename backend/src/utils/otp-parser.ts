/**
 * Normalizes a raw SMS body: strips control characters, collapses whitespace,
 * and trims. Used so the same message dedups consistently regardless of minor
 * vendor formatting differences (newlines, tabs, byte order marks).
 */
export function normalizeMessage(rawMessage: string): string {
  return rawMessage
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const OTP_KEYWORDS =
  /\b(?:code|verification\s*code|verify|otp|password|pin|token|login\s*code)\b/gi;

const OTP_DIGITS = /\b\d{4,8}\b/g;

/**
 * Extracts a one-time password from a raw SMS message. Prefers the digit group
 * closest to an OTP keyword (e.g. "Your code is 123456"), falling back to the
 * first standalone 4-8 digit group.
 */
export function extractOtp(rawMessage: string): string | null {
  const message = normalizeMessage(rawMessage);
  if (!message) return null;

  const keywordPositions: number[] = [];
  let keywordMatch: RegExpExecArray | null;
  while ((keywordMatch = OTP_KEYWORDS.exec(message))) {
    keywordPositions.push(keywordMatch.index);
  }

  const candidates: Array<{ pos: number; value: string }> = [];
  let digitMatch: RegExpExecArray | null;
  while ((digitMatch = OTP_DIGITS.exec(message))) {
    candidates.push({ pos: digitMatch.index, value: digitMatch[0] });
  }

  if (candidates.length === 0) return null;

  if (keywordPositions.length > 0) {
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const candidate of candidates) {
      for (const keywordPos of keywordPositions) {
        const distance = Math.abs(candidate.pos - keywordPos);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = candidate.value;
        }
      }
    }
    if (best) return best;
  }

  return candidates[0].value;
}

export function hashMessage(phoneNumber: string, rawMessage: string): string {
  const input = `${phoneNumber}|${normalizeMessage(rawMessage)}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
