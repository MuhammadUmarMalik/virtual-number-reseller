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
  smsbowerApiKey: getEnv("SMSBOWER_API_KEY", ""),
  smsbowerBaseUrl: getEnv("SMSBOWER_BASE_URL", "https://smsbower.page"),
  smsbowerWebhookEnabled: getEnv("SMSBOWER_WEBHOOK_ENABLED", "true"),
  numberLifetimeMinutes: Number(getEnv("NUMBER_LIFETIME_MINUTES", "5")),
  otpPollingIntervalMs: Number(getEnv("OTP_POLLING_INTERVAL_MS", "15000")),
  expireNumbersIntervalMs: Number(getEnv("EXPIRE_NUMBERS_INTERVAL_MS", "300000")),
  autoRefundIntervalMs: Number(getEnv("AUTO_REFUND_INTERVAL_MS", "300000")),
  vendorSyncIntervalMs: Number(getEnv("VENDOR_SYNC_INTERVAL_MS", "60000")),
  liveStockTtlMs: Number(getEnv("LIVE_STOCK_TTL_MS", "15000")),
} as const;
