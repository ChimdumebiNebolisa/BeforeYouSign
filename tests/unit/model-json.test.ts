import { describe, expect, it } from "vitest";

import { extractFirstJsonObject, parseReportJson } from "@/lib/analysis/model-json";

describe("parseReportJson", () => {
  it("parses plain JSON", () => {
    const result = parseReportJson('{"summary":"ok"}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("parses fenced JSON", () => {
    const result = parseReportJson('```json\n{"summary":"ok"}\n```');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("extracts JSON from surrounding prose", () => {
    const result = parseReportJson('Here is the report: {"summary":"ok"} done.');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("rejects empty input", () => {
    expect(parseReportJson("")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects invalid JSON", () => {
    expect(parseReportJson("{not json")).toEqual({ ok: false, reason: "invalid_json" });
  });
});

describe("extractFirstJsonObject", () => {
  it("returns null when no object present", () => {
    expect(extractFirstJsonObject("no json here")).toBeNull();
  });

  it("respects escaped quotes in strings", () => {
    const input = '{"quote":"He said \\"hello\\""}';
    expect(extractFirstJsonObject(input)).toBe(input);
  });
});
