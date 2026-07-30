import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(30).default(10),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  COOKIE_DOMAIN: z.string().min(1).optional(),
  ENCRYPTION_KEY: z.string().min(24),
  JAZZCASH_MERCHANT_ID: z.string().optional().default(""),
  JAZZCASH_PASSWORD: z.string().optional().default(""),
  JAZZCASH_INTEGRITY_SALT: z.string().optional().default(""),
  JAZZCASH_CALLBACK_URL: z.string().url(),
  EASYPAISA_STORE_ID: z.string().optional().default(""),
  EASYPAISA_HASH_KEY: z.string().optional().default(""),
  EASYPAISA_CALLBACK_URL: z.string().url(),
  VENDOR_BASE_URL: z.string().url(),
  VENDOR_API_KEY: z.string().optional().default(""),
  ALLOWED_VENDOR_HOSTNAMES: z.string().default("vendor.example.com")
});

export type AppEnv = z.infer<typeof baseEnvSchema> & {
  corsOrigins: string[];
  allowedVendorHostnames: string[];
};

export function loadEnv(input: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = baseEnvSchema.parse(input);

  return {
    ...parsed,
    corsOrigins: splitList(parsed.CORS_ORIGINS),
    allowedVendorHostnames: splitList(parsed.ALLOWED_VENDOR_HOSTNAMES)
  };
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
