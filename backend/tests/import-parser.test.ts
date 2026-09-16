import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  analyzeRows,
  parseSpreadsheet,
  validateRows,
} from "../src/services/import.service.js";

function csvBuffer(rows: string[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return XLSX.write(wb, { type: "buffer", bookType: "csv" }) as Buffer;
}

describe("parseSpreadsheet", () => {
  it("detects number/endpoint columns and skips the header row", () => {
    const buffer = csvBuffer([
      ["number", "endpoint"],
      ["+12025550123", "https://8.8.8.8/otp"],
      ["+12025550124", "https://8.8.8.8/otp"],
    ]);

    const parsed = parseSpreadsheet(buffer, "numbers.csv");
    expect(parsed).toEqual([
      { row: 2, number: "+12025550123", endpoint: "https://8.8.8.8/otp" },
      { row: 3, number: "+12025550124", endpoint: "https://8.8.8.8/otp" },
    ]);
  });

  it("tolerates header variations like phone/url", () => {
    const buffer = csvBuffer([
      ["phone", "url"],
      ["+12025550123", "https://8.8.8.8/otp"],
    ]);
    expect(parseSpreadsheet(buffer, "nums.csv")[0].number).toBe("+12025550123");
  });

  it("throws when a required column is missing", () => {
    const buffer = csvBuffer([
      ["number"],
      ["+12025550123"],
    ]);
    expect(() => parseSpreadsheet(buffer, "nums.csv")).toThrow(
      "Missing required columns"
    );
  });

  it("throws when there are no data rows", () => {
    const buffer = csvBuffer([["number", "endpoint"]]);
    expect(() => parseSpreadsheet(buffer, "nums.csv")).toThrow("no data rows");
  });
});

describe("validateRows", () => {
  it("accepts E.164 numbers matching the country code and safe endpoints", async () => {
    const { valid, invalid } = await validateRows(
      [{ row: 2, number: "+12025550123", endpoint: "https://8.8.8.8/otp" }],
      { countryCode: "+1" }
    );
    expect(valid).toHaveLength(1);
    expect(invalid).toHaveLength(0);
  });

  it("accepts numbers written without the + prefix and stores the E.164 form", async () => {
    const { valid, invalid } = await validateRows(
      [{ row: 2, number: "12025550123", endpoint: "https://8.8.8.8/otp" }],
      { countryCode: "+1" }
    );
    expect(invalid).toHaveLength(0);
    expect(valid[0].number).toBe("+12025550123");
  });

  it("flags numbers in the wrong format", async () => {
    const { valid, invalid } = await validateRows(
      [{ row: 2, number: "12345", endpoint: "https://8.8.8.8/otp" }],
      { countryCode: "+1" }
    );
    expect(valid).toHaveLength(0);
    expect(invalid[0].errors.join()).toMatch(/international format/);
  });

  it("flags numbers that do not match the product country code", async () => {
    const { valid, invalid } = await validateRows(
      [{ row: 2, number: "+923001234567", endpoint: "https://8.8.8.8/otp" }],
      { countryCode: "+1" }
    );
    expect(valid).toHaveLength(0);
    expect(invalid[0].errors.join()).toMatch(/does not match country code/);
  });

  it("flags dangerous endpoints", async () => {
    const { valid, invalid } = await validateRows(
      [{ row: 2, number: "+12025550123", endpoint: "http://192.168.0.1/otp" }],
      { countryCode: "+1" }
    );
    expect(valid).toHaveLength(0);
    expect(invalid[0].errors.join()).toMatch(/HTTPS|private/);
  });
});

describe("analyzeRows", () => {
  it("deduplicates repeats within the file and against existing numbers", () => {
    const input = [
      { row: 2, number: "+12025550123" },
      { row: 3, number: "+12025550123" },
      { row: 4, number: "+12025550124" },
      { row: 5, number: "+12025550125" },
    ] as Array<{ row: number; number: string }>;

    const { unique, duplicates } = analyzeRows(input as never, new Set(["+12025550125"]));
    expect(unique.map((row) => row.number)).toEqual([
      "+12025550123",
      "+12025550124",
    ]);
    expect(duplicates).toBe(2);
  });
});