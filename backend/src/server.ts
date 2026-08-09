import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { logger } from "./config/logger.js";
import { startJobs } from "./jobs/index.js";

const app = createApp();

async function start() {
  await prisma.$connect();
  await startJobs();
  app.listen(env.port, () => {
    logger.info(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

start().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});
