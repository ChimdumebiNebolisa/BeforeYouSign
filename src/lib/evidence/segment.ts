import { createHash } from "node:crypto";

import type { ExtractedTextPage } from "@/lib/pdf/extract-text";
import type { EvidenceChunk } from "@/lib/evidence/types";

const MAX_CHUNK_CHARS = 800;
const MIN_CHUNK_CHARS = 40;

function hashChunkId(documentId: string, page: number, start: number, end: number): string {
  const payload = `${documentId}:${page}:${start}:${end}`;
  return `ev-${createHash("sha256").update(payload).digest("hex").slice(0, 12)}`;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_CHUNK_CHARS) return [paragraph];
  const sentences = paragraph.split(/(?<=[.!?])\s+/);
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > MAX_CHUNK_CHARS && current) {
      out.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) out.push(current);
  return out;
}

export function segmentDocument(
  documentId: string,
  pages: ExtractedTextPage[],
): EvidenceChunk[] {
  const chunks: EvidenceChunk[] = [];
  let ordinal = 0;

  for (const page of pages) {
    const paragraphs = splitParagraphs(page.text);
    for (const paragraph of paragraphs) {
      for (const segment of splitLongParagraph(paragraph)) {
        if (segment.length < MIN_CHUNK_CHARS) continue;
        const startIndex = page.text.indexOf(segment);
        if (startIndex < 0) continue;
        const endIndex = startIndex + segment.length;
        chunks.push({
          id: hashChunkId(documentId, page.page, startIndex, endIndex),
          page: page.page,
          startIndex,
          endIndex,
          text: segment,
          ordinal: ordinal++,
        });
      }
    }
  }

  return chunks;
}

export function findChunkForSpan(
  chunks: EvidenceChunk[],
  page: number,
  startIndex: number,
  endIndex: number,
): EvidenceChunk | null {
  return (
    chunks.find(
      (chunk) =>
        chunk.page === page &&
        chunk.startIndex <= startIndex &&
        chunk.endIndex >= endIndex,
    ) ?? null
  );
}

export function resolveQuoteToChunk(
  chunks: EvidenceChunk[],
  page: number,
  quote: string,
): EvidenceChunk | null {
  const pageChunks = chunks.filter((c) => c.page === page);
  const trimmed = quote.trim();
  if (!trimmed) return null;

  for (const chunk of pageChunks) {
    if (chunk.text.includes(trimmed)) return chunk;
  }

  const collapsed = trimmed.replace(/\s+/g, " ");
  if (collapsed.length < 20) return null;

  for (const chunk of pageChunks) {
    if (chunk.text.replace(/\s+/g, " ").includes(collapsed)) return chunk;
  }

  return null;
}
