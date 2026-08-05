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
} as const;
