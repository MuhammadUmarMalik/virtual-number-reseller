import dotenv from "dotenv";

dotenv.config();

const getEnv = (key: string, fallback = ""): string => process.env[key] ?? fallback;

export const env = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: Number(getEnv("PORT", "4000")),
  databaseUrl: getEnv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/number_reseller"
  ),
  accessTokenSecret: getEnv("ACCESS_TOKEN_SECRET", "dev-access-secret"),
  accessTokenExpiry: getEnv("ACCESS_TOKEN_EXPIRY", "15m"),
  refreshTokenSecret: getEnv("REFRESH_TOKEN_SECRET", "dev-refresh-secret"),
  refreshTokenExpiryDays: Number(getEnv("REFRESH_TOKEN_EXPIRY_DAYS", "30")),
  corsOrigin: getEnv("CORS_ORIGIN", "http://localhost:3000"),
  jwtIssuer: getEnv("JWT_ISSUER", "number-reseller"),
  vendorApiUrl: getEnv(
    "VENDOR_API_URL",
    "https://api.durianrcs.com/out/ext_api/"
  ),
  vendorUsername: getEnv("VENDOR_USERNAME", ""),
  vendorApiKey: getEnv("VENDOR_API_KEY", ""),
  vendorPid: getEnv("VENDOR_PID", ""),
  vendorNoBlack: getEnv("VENDOR_NOBLACK", "0"),
  otpPollingIntervalMs: Number(getEnv("OTP_POLLING_INTERVAL_MS", "15000")),
  expireNumbersIntervalMs: Number(getEnv("EXPIRE_NUMBERS_INTERVAL_MS", "300000")),
  vendorSyncIntervalMs: Number(getEnv("VENDOR_SYNC_INTERVAL_MS", "600000")),
} as const;
