export const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "test") console.log("[INFO]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
};
