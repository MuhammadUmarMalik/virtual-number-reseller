import type { Response } from "express";
import type { ApiSuccessBody } from "@number-reseller/types";

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    requestId: res.req.requestId
  };

  return res.status(status).json(body);
}
