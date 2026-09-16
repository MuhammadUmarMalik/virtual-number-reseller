import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/database.js";
import { productRepository } from "../repositories/product.repository.js";
import { productNumberRepository } from "../repositories/product-number.repository.js";
import { createAuditLog } from "./audit.service.js";
import { AppError } from "../utils/app-error.js";
import { assertSafeProviderUrl } from "../utils/ssrf.js";
import {
  isValidE164Number,
  matchesDialCode,
  normalizePhoneNumber,
} from "../utils/phone.js";
import type { ImportProductInput } from "../validators/import.validator.js";

export interface ParsedRow {
  row: number; // 1-based spreadsheet row (excluding header)
  number: string;
  endpoint: string;
}

export type ValidRow = ParsedRow;

export interface InvalidRow extends ParsedRow {
  errors: string[];
}

export interface ImportPreviewResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: Pick<ValidRow, "row" | "number">[];
  invalidRows: Pick<InvalidRow, "row" | "number" | "errors">[];
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  invalid: number;
  total: number;
  accepted: number;
  product: {
    id: string;
    name: string;
    slug: string;
    country: string;
    countryCode: string;
    service: string;
    numberType: string;
    description: string | null;
    sellingPrice: string;
    refundWindowHours: number;
    availableStock: number;
    source: string;
    currency: string;
    status: string;
  };
}

const ENDPOINT_LABELS = ["endpoint", "url", "link", "provider"];
const NUMBER_LABELS = ["number", "phone"];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parses a CSV/XLSX/XLS file into raw number/endpoint rows. The header row is
 * detected by matching column names; the first row is always treated as the
 * header, matching the documented template (number, endpoint).
 */
export function parseSpreadsheet(buffer: Buffer, _fileName: string): ParsedRow[] {
  let workbook: XLSX.WorkBook;
  try {
    // raw keeps plain-text (CSV) cells as strings so "+1202..." numbers
    // are not coerced by the parser and lose their "+" prefix.
    workbook = XLSX.read(buffer, { type: "buffer", raw: true });
  } catch {
    throw new AppError("Unable to read the spreadsheet file. Check the format.", 400);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new AppError("Spreadsheet is empty", 400);
  }

  let rows: Record<string, unknown>[];
  try {
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: true,
    });
  } catch {
    throw new AppError("Spreadsheet has no readable rows", 400);
  }
  if (rows.length === 0) {
    throw new AppError("Spreadsheet has no data rows", 400);
  }

  const headers = Object.keys(rows[0] ?? {});
  const numberCol = headers.find((key) => NUMBER_LABELS.some((label) => key.toLowerCase().includes(label)));
  const endpointCol = headers.find((key) => ENDPOINT_LABELS.some((label) => key.toLowerCase().includes(label)));

  if (!numberCol || !endpointCol) {
    throw new AppError(
      "Missing required columns. Expected a 'number' column and an 'endpoint' column.",
      400
    );
  }

  const parsed: ParsedRow[] = [];
  for (const [index, raw] of rows.entries()) {
    const number = String(raw[numberCol] ?? "").trim();
    const endpoint = String(raw[endpointCol] ?? "").trim();
    if (!number && !endpoint) continue; // skip fully empty rows
    parsed.push({ row: index + 2, number, endpoint });
  }

  if (parsed.length === 0) {
    throw new AppError("Spreadsheet has no data rows", 400);
  }
  return parsed;
}

export async function validateRows(
  parsed: ParsedRow[],
  opts: { countryCode: string }
): Promise<{ valid: ValidRow[]; invalid: InvalidRow[] }> {
  const valid: ValidRow[] = [];
  const invalid: InvalidRow[] = [];

  for (const item of parsed) {
    const errors: string[] = [];

    const normalized = normalizePhoneNumber(item.number);
    // Accept numbers written without the "+" — Excel sheets commonly omit it —
    // and always store the canonical E.164 form so the prefix is never lost.
    const number =
      normalized && !normalized.startsWith("+") ? `+${normalized}` : normalized;
    if (!number) {
      errors.push("Number is required");
    } else if (!isValidE164Number(number)) {
      errors.push("Phone number must be in international format (e.g. +923001234567)");
    } else if (!matchesDialCode(number, opts.countryCode)) {
      errors.push(`Number does not match country code ${opts.countryCode}`);
    }

    const endpoint = item.endpoint.trim();
    if (!endpoint) {
      errors.push("Endpoint is required");
    } else {
      try {
        await assertSafeProviderUrl(endpoint);
      } catch (error) {
        errors.push(error instanceof AppError ? error.message : "Endpoint is invalid");
      }
    }

    if (errors.length > 0) {
      invalid.push({ row: item.row, number, endpoint, errors });
    } else {
      valid.push({ row: item.row, number, endpoint });
    }
  }

  return { valid, invalid };
}

export function analyzeRows(
  valid: ValidRow[],
  existingNumbers: Set<string>
): { unique: ValidRow[]; duplicates: number } {
  const seen = new Set<string>();
  const unique: ValidRow[] = [];
  let duplicates = 0;

  for (const row of valid) {
    if (seen.has(row.number) || existingNumbers.has(row.number)) {
      duplicates += 1;
      continue;
    }
    seen.add(row.number);
    unique.push(row);
  }

  return { unique, duplicates };
}

async function collectAnalysis(
  parsed: ParsedRow[],
  opts: { countryCode: string }
): Promise<{
  valid: ValidRow[];
  invalid: InvalidRow[];
  duplicates: number;
  unique: ValidRow[];
}> {
  const { valid, invalid } = await validateRows(parsed, opts);
  const existing = await productNumberRepository.findExistingNumbers(
    valid.map((row) => row.number)
  );
  const existingSet = new Set(existing.map((entry) => entry.number));
  const { unique, duplicates } = analyzeRows(valid, existingSet);
  return { valid, invalid, duplicates, unique };
}

export const importService = {
  async preview(
    input: ImportProductInput,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<ImportPreviewResult> {
    const parsed = parseSpreadsheet(fileBuffer, fileName);
    const { valid, invalid, duplicates } = await collectAnalysis(parsed, {
      countryCode: input.countryCode,
    });

    // Endpoints are never echoed back to the client, even during preview.
    return {
      totalRows: parsed.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      duplicateCount: duplicates,
      validRows: valid.slice(0, 100).map(({ row, number }) => ({ row, number })),
      invalidRows: invalid
        .slice(0, 20)
        .map(({ row, number, errors }) => ({ row, number, errors })),
    };
  },

  async importProduct(
    input: ImportProductInput,
    fileBuffer: Buffer,
    fileName: string,
    adminId: string
  ): Promise<ImportResult> {
    const parsed = parseSpreadsheet(fileBuffer, fileName);

    const slug = slugify(input.name);
    const [nameTaken, slugTaken] = await Promise.all([
      productRepository.findByName(input.name),
      productRepository.findBySlug(slug),
    ]);
    if (nameTaken || slugTaken) {
      throw new AppError(
        `A product named "${input.name}" already exists`,
        409
      );
    }

    const { invalid, duplicates, unique } = await collectAnalysis(parsed, {
      countryCode: input.countryCode,
    });
    if (unique.length === 0) {
      throw new AppError(
        "No valid rows to import. Fix the spreadsheet rows or the product details.",
        400
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          slug,
          country: input.country,
          countryCode: input.countryCode,
          countryDialCode: input.countryCode,
          service: input.service,
          numberType: input.numberType,
          description: input.description || null,
          sellingPrice: new Prisma.Decimal(input.sellingPrice.toString()),
          vendorCost: new Prisma.Decimal(0),
          refundWindowHours: input.refundWindowHours,
          availableStock: unique.length,
          source: "IMPORTED",
          currency: input.currency,
          status: input.status ?? "ACTIVE",
        },
      });

      await tx.productNumber.createMany({
        data: unique.map((row) => ({
          productId: created.id,
          number: row.number,
          providerEndpoint: row.endpoint.trim(),
        })),
        skipDuplicates: false,
      });

      await createAuditLog(tx, {
        adminId,
        action: "PRODUCT_IMPORT",
        entityType: "Product",
        entityId: created.id,
        newValue: {
          imported: unique.length,
          duplicates,
          invalid: invalid.length,
          currency: input.currency,
        },
      });

      return created;
    });

    return {
      imported: unique.length,
      duplicates,
      invalid: invalid.length,
      total: parsed.length,
      accepted: unique.length,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        country: product.country,
        countryCode: product.countryCode,
        service: product.service,
        numberType: product.numberType,
        description: product.description,
        sellingPrice: product.sellingPrice.toString(),
        refundWindowHours: product.refundWindowHours,
        availableStock: product.availableStock,
        source: product.source,
        currency: product.currency,
        status: product.status,
      },
    };
  },
};