import type { EvidenceChunk, EvidenceRegistry, GroundedEvidenceRef } from "@/lib/evidence/types";
import { segmentDocument } from "@/lib/evidence/segment";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

export function createEvidenceRegistry(
  documentId: string,
  pages: ExtractedTextPage[],
): EvidenceRegistry {
  const chunks = segmentDocument(documentId, pages);
  const byId = new Map<string, EvidenceChunk>();
  for (const chunk of chunks) {
    byId.set(chunk.id, chunk);
  }
  return { chunks, byId };
}

export function hydrateEvidence(
  registry: EvidenceRegistry,
  evidenceId: string,
): GroundedEvidenceRef | null {
  const chunk = registry.byId.get(evidenceId);
  if (!chunk) return null;
  return {
    evidenceId: chunk.id,
    page: chunk.page,
    quote: chunk.text,
    startIndex: chunk.startIndex,
    endIndex: chunk.endIndex,
    supportStatus: "grounded",
  };
}

export function hydrateEvidenceFromSpan(
  registry: EvidenceRegistry,
  page: number,
  startIndex: number,
  endIndex: number,
  quote: string,
): GroundedEvidenceRef | null {
  const pageText = registry.chunks.find((c) => c.page === page)?.text;
  const chunk =
    registry.chunks.find(
      (c) =>
        c.page === page &&
        c.startIndex === startIndex &&
        c.endIndex === endIndex,
    ) ?? null;

  if (chunk) {
    return hydrateEvidence(registry, chunk.id);
  }

  if (startIndex >= 0 && endIndex > startIndex) {
  const matchingChunk = registry.chunks.find(
    (c) => c.page === page && c.startIndex <= startIndex && c.endIndex >= endIndex,
  );
  if (matchingChunk) {
    return {
      evidenceId: matchingChunk.id,
      page,
      quote: quote.trim(),
      startIndex,
      endIndex,
      supportStatus: "grounded",
    };
  }
  }

  if (!pageText && quote) {
    const byQuote = registry.chunks.find(
      (c) => c.page === page && c.text.includes(quote.trim()),
    );
    if (byQuote) return hydrateEvidence(registry, byQuote.id);
  }

  return null;
}

export function registerSpanEvidence(
  registry: EvidenceRegistry,
  input: {
    documentId: string;
    page: number;
    startIndex: number;
    endIndex: number;
    text: string;
  },
): GroundedEvidenceRef {
  const existing = registry.chunks.find(
    (c) =>
      c.page === input.page &&
      c.startIndex === input.startIndex &&
      c.endIndex === input.endIndex,
  );

  if (existing) {
    return hydrateEvidence(registry, existing.id)!;
  }

  const id = `ev-${input.documentId.slice(0, 8)}-${input.page}-${input.startIndex}`;
  const chunk: EvidenceChunk = {
    id,
    page: input.page,
    startIndex: input.startIndex,
    endIndex: input.endIndex,
    text: input.text,
    ordinal: registry.chunks.length,
  };
  registry.chunks.push(chunk);
  registry.byId.set(id, chunk);

  return {
    evidenceId: id,
    page: input.page,
    quote: input.text,
    startIndex: input.startIndex,
    endIndex: input.endIndex,
    supportStatus: "grounded",
  };
}
