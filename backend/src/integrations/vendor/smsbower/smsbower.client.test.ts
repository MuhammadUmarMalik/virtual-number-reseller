import { describe, expect, it } from "vitest";
import { normalizeCountries } from "./smsbower.client.js";

describe("normalizeCountries", () => {
  it("handles array of country objects", () => {
    const input = [
      { id: 0, rus: "Россия", eng: "Russia", chn: "俄罗斯" },
      { id: 187, rus: "США", eng: "United States", chn: "美国" },
    ];
    expect(normalizeCountries(input)).toEqual(input);
  });

  it("handles object keyed by country id with objects", () => {
    const input = {
      "0": { id: 0, rus: "Россия", eng: "Russia", chn: "俄罗斯" },
      "187": { id: 187, rus: "США", eng: "United States", chn: "美国" },
    };
    expect(normalizeCountries(input)).toEqual([
      input["0"],
      input["187"],
    ]);
  });

  it("handles object keyed by id with string names", () => {
    const input = {
      "0": "Россия",
      "187": "США",
    };
    expect(normalizeCountries(input)).toEqual([
      { id: 0, rus: "Россия", eng: "Россия", chn: "Россия" },
      { id: 187, rus: "США", eng: "США", chn: "США" },
    ]);
  });

  it("drops entries with missing or null ids", () => {
    const input = {
      "0": { id: 0, rus: "Россия", eng: "Russia", chn: "俄罗斯" },
      bad: { id: null, rus: "x", eng: "x", chn: "x" },
      worse: { rus: "y", eng: "y", chn: "y" },
    };
    expect(normalizeCountries(input)).toEqual([input["0"]]);
  });

  it("derives id from the object key when inner objects lack an id field", () => {
    const input = {
      "187": { rus: "США", eng: "United States", chn: "美国" },
      "7": { rus: "Россия", eng: "Russia", chn: "俄罗斯" },
    };
    expect(normalizeCountries(input)).toEqual([
      { id: 7, rus: "Россия", eng: "Russia", chn: "俄罗斯" },
      { id: 187, rus: "США", eng: "United States", chn: "美国" },
    ]);
  });

  it("handles array entries with string ids", () => {
    const input = [
      { id: "187", rus: "США", eng: "United States", chn: "美国" },
      { id: "7", rus: "Россия", eng: "Russia", chn: "俄罗斯" },
    ];
    expect(normalizeCountries(input)).toEqual([
      { id: 187, rus: "США", eng: "United States", chn: "美国" },
      { id: 7, rus: "Россия", eng: "Russia", chn: "俄罗斯" },
    ]);
  });

  it("returns [] for non-object input", () => {
    expect(normalizeCountries(null)).toEqual([]);
    expect(normalizeCountries("text")).toEqual([]);
    expect(normalizeCountries(42)).toEqual([]);
  });
});
