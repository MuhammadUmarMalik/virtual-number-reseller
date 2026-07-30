import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  req.requestId = incoming && incoming.length <= 128 ? incoming : `req_${randomUUID()}`;
  res.setHeader("x-request-id", req.requestId);
  next();
}
