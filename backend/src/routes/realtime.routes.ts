import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/app-error.js";
import { realtime } from "../realtime/events.js";

const router = Router();

/**
 * EventSource cannot send an Authorization header, so the access token is
 * accepted from the `token` query param on this SSE endpoint only.
 */
async function authForEventStream(req: Request, _res: Response, next: NextFunction) {
  const token = (req.query.token as string | undefined) ?? "";

  let payload: { sub: string };
  try {
    payload = jwt.verify(token, env.accessTokenSecret, {
      issuer: env.jwtIssuer,
    }) as { sub: string };
  } catch {
    next(new AppError("Invalid or expired token", 401));
    return;
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    next(new AppError("User not found", 401));
    return;
  }
  if (user.status !== "ACTIVE") {
    next(new AppError("Your account is suspended or blocked", 403));
    return;
  }

  req.user = user;
  next();
}

router.get("/events", authForEventStream, (req, res) => {
  const userId = req.user!.id;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`: connected\n\n`);

  const heartbeat = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 25_000);

  const unsubscribe = realtime.subscribe(userId, (message) => {
    res.write(`event: ${message.type}\ndata: ${JSON.stringify(message.data)}\n\n`);
  });

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

export default router;
