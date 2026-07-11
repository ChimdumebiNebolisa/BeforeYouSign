import { createHash } from "node:crypto";

import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

/**
 * Derives a stable content key from normalized extracted pages.
 * Used only as a client/server stale-state and accidental mismatch check —
 * not authentication, authorization, or tamper prevention (the client can recompute it).
 */
export function computeContentIntegrityKey(pages: ExtractedTextPage[]): string {
  const payload = pages.map((p) => p.text).join("\n");
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

/** @deprecated Use computeContentIntegrityKey — kept as alias for existing API field `documentId`. */
export function hashDocumentId(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
