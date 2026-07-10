import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createEvidenceRegistry, hydrateEvidence } from "@/lib/evidence/registry";
import { segmentDocument } from "@/lib/evidence/segment";

describe("evidence registry", () => {
  const pages = [
    {
      page: 1,
      text: "Monthly rent is $1,450 due on the first of each month. Security deposit: $1,450.",
    },
  ];

  it("creates stable chunk IDs for identical input", () => {
    const a = createEvidenceRegistry("doc-a", pages);
    const b = createEvidenceRegistry("doc-a", pages);
    expect(a.chunks.map((c) => c.id)).toEqual(b.chunks.map((c) => c.id));
  });

  it("hydrates evidence by ID with exact offsets", () => {
    const registry = createEvidenceRegistry("doc-b", pages);
    const chunk = registry.chunks[0];
    expect(chunk).toBeDefined();
    const hydrated = hydrateEvidence(registry, chunk!.id);
    expect(hydrated).not.toBeNull();
    expect(hydrated?.page).toBe(1);
    expect(hydrated?.supportStatus).toBe("grounded");
    const pageText = pages[0]!.text;
    expect(pageText.slice(hydrated!.startIndex!, hydrated!.endIndex!)).toBe(hydrated!.quote);
  });

  it("returns null for unknown evidence IDs", () => {
    const registry = createEvidenceRegistry("doc-c", pages);
    expect(hydrateEvidence(registry, "ev-unknown")).toBeNull();
  });

  it("segments paragraphs into chunks when long enough", () => {
    const repeatedPages = [
      {
        page: 1,
        text: "Tenant shall maintain the premises in good condition and report maintenance issues promptly.\n\nLandlord may enter with reasonable notice of at least twenty-four hours before entry.",
      },
    ];
    const chunks = segmentDocument("doc-d", repeatedPages);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });
});
