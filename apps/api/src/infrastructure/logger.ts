import pino from "pino";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "passwordHash",
  "accessToken",
  "refreshToken",
  "otp",
  "otpEncrypted",
  "apiKey",
  "apiKeyEncrypted",
  "rawCallback",
  "rawCallbackEncrypted"
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]"
  }
});
