import type { Request, Response } from "express";
import { importService } from "../services/import.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { successResponse } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

function requireUploadedFile(req: Request) {
  if (!req.file) {
    throw new AppError("Spreadsheet file is required", 400);
  }
  return req.file;
}

export const importController = {
  preview: asyncHandler(async (req: Request, res: Response) => {
    const file = requireUploadedFile(req);
    const data = await importService.preview(req.body, file.buffer, file.originalname);
    res.json(successResponse("Import preview ready", data));
  }),

  importProduct: asyncHandler(async (req: Request, res: Response) => {
    const file = requireUploadedFile(req);
    const data = await importService.importProduct(
      req.body,
      file.buffer,
      file.originalname,
      req.user!.id
    );
    res.status(201).json(successResponse("Product imported", data));
  }),
};