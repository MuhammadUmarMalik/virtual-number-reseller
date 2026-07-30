import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import type { Express } from "express";
import { env } from "../config/env";
import { ApiError } from "../common/errors";

export function applySecurityMiddleware(app: Express) {
  app.disable("x-powered-by");
  app.use(helmet());
  if (env.NODE_ENV !== "production") {
    app.use((_req, res, next) => {
      res.removeHeader("Strict-Transport-Security");
      next();
    });
  }
  app.use(compression());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("CORS origin is not allowed"));
      },
      credentials: true
    }),
  );
  app.use((req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    const origin = req.get("origin");
    if (origin && !env.corsOrigins.includes(origin)) {
      return next(new ApiError("INVALID_ORIGIN", "The request origin is not allowed.", 403));
    }
    next();
  });
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: true,
      legacyHeaders: false
    }),
  );
}
