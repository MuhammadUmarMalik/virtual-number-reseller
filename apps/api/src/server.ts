import { createApp } from "./app";
import { logger } from "./infrastructure/logger";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  logger.info({ port }, "API listening");
});
