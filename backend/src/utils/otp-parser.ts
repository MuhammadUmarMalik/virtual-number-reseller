const OTP_PATTERN = /\b(\d{4,8})\b/;

export function extractOtp(rawMessage: string): string | null {
  const match = rawMessage.match(OTP_PATTERN);
  return match ? match[1] : null;
}

export function hashMessage(phoneNumber: string, rawMessage: string): string {
  const input = `${phoneNumber}|${rawMessage}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}
