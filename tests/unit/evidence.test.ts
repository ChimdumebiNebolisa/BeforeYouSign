import { describe, expect, it } from "vitest";

import { createEvidenceRegistry, hydrateEvidence } from "@/lib/evidence/registry";
import {
  segmentDocument,
  findChunkForSpan,
  resolveQuoteToChunk,
} from "@/lib/evidence/segment";
import { buildEvidenceIndex, lookupEvidenceHighlight } from "@/lib/evidence/index";
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

  it("segments long paragraphs into multiple chunks", () => {
    const longSentence = "Rent shall be paid on time. ".repeat(40).trim();
    const chunks = segmentDocument("doc-long", [{ page: 1, text: longSentence }]);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("finds chunk spans and evidence index lookups", () => {
    const registry = createEvidenceRegistry("doc-e", pages);
    const chunk = registry.chunks[0]!;
    const found = findChunkForSpan(registry.chunks, chunk.page, chunk.startIndex, chunk.endIndex);
    expect(found?.id).toBe(chunk.id);

    const index = buildEvidenceIndex(registry);
    expect(lookupEvidenceHighlight(index, chunk.id)?.page).toBe(1);
    expect(lookupEvidenceHighlight(index, "missing")).toBeNull();
    expect(lookupEvidenceHighlight(undefined, chunk.id)).toBeNull();
  });

  it("returns null when span does not match any chunk", () => {
    const registry = createEvidenceRegistry("doc-f", pages);
    expect(findChunkForSpan(registry.chunks, 1, 9999, 10000)).toBeNull();
  });

  it("skips segments that cannot be located in raw page text", () => {
    const sentenceOne = `${"Alpha ".repeat(30).trim()}.`;
    const sentenceTwo = `${"Beta ".repeat(30).trim()}.`;
    const pageText = `${sentenceOne}\n${sentenceTwo}`;
    const chunks = segmentDocument("doc-g", [{ page: 1, text: pageText }]);
    const joined = `${sentenceOne} ${sentenceTwo}`;
    expect(pageText.includes(joined)).toBe(false);
    expect(chunks.every((chunk) => pageText.includes(chunk.text))).toBe(true);
  });

  it("resolves quotes with whitespace normalization", () => {
    const registry = createEvidenceRegistry("doc-h", pages);
    const chunk = registry.chunks[0]!;
    const spacedQuote = chunk.text.replace(/\s+/g, "  ");
    expect(resolveQuoteToChunk(registry.chunks, chunk.page, spacedQuote)?.id).toBe(chunk.id);
    expect(resolveQuoteToChunk(registry.chunks, chunk.page, "   ")).toBeNull();
    expect(resolveQuoteToChunk(registry.chunks, chunk.page, "short")).toBeNull();
  });
});
