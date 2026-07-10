import { describe, expect, it } from "vitest";

import { extractFirstJsonObject, parseGeminiModelJson } from "@/lib/analysis/model-json";

describe("parseGeminiModelJson", () => {
  it("parses plain JSON", () => {
    const result = parseGeminiModelJson('{"summary":"ok"}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("parses fenced JSON", () => {
    const result = parseGeminiModelJson('```json\n{"summary":"ok"}\n```');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("extracts JSON from surrounding prose", () => {
    const result = parseGeminiModelJson('Here is the report: {"summary":"ok"} done.');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ summary: "ok" });
  });

  it("rejects empty input", () => {
    expect(parseGeminiModelJson("")).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects invalid JSON", () => {
    expect(parseGeminiModelJson("{not json")).toEqual({ ok: false, reason: "invalid_json" });
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
