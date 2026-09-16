import multer from "multer";
import { AppError } from "../utils/app-error.js";

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const allowed = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!allowed) {
      cb(new AppError("Only .csv, .xlsx and .xls files are allowed", 400));
      return;
    }
    cb(null, true);
  },
});