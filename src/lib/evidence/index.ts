import type { EvidenceRegistry } from "@/lib/evidence/types";

export type EvidenceIndexEntry = {
  page: number;
  startIndex: number;
  endIndex: number;
  quote: string;
};

export type EvidenceIndex = Record<string, EvidenceIndexEntry>;

export function buildEvidenceIndex(registry: EvidenceRegistry): EvidenceIndex {
  const index: EvidenceIndex = {};
  for (const chunk of registry.chunks) {
    index[chunk.id] = {
      page: chunk.page,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      quote: chunk.text,
    };
  }
  return index;
}

export function lookupEvidenceHighlight(
  index: EvidenceIndex | undefined,
  evidenceId: string | undefined,
): EvidenceIndexEntry | null {
  if (!index || !evidenceId) return null;
  return index[evidenceId] ?? null;
}
