import { prisma } from "@number-reseller/database";
import { redis } from "./redis";

export interface DependencyHealth {
  status: "ok" | "down";
  dependency: "database" | "redis";
  latencyMs: number;
}

export async function checkDatabaseHealth(): Promise<DependencyHealth> {
  const startedAt = Date.now();
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    dependency: "database",
    latencyMs: Date.now() - startedAt
  };
}

export async function checkRedisHealth(): Promise<DependencyHealth> {
  const startedAt = Date.now();

  if (redis.status === "wait") {
    await redis.connect();
  }

  await redis.ping();

  return {
    status: "ok",
    dependency: "redis",
    latencyMs: Date.now() - startedAt
  };
}
