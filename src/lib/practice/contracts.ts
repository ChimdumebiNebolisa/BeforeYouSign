import type { EvidenceRef } from "@/lib/analysis/schema";

export const MAX_AGENDA_ITEMS = 8;
export const MAX_CONTEXT_CHARS = 4_000;

export type EvidenceOrigin = "synthetic_example" | "practice_roleplay";
export type AgendaCategory = "fees" | "notice" | "renewal" | "utilities" | "maintenance" | "other";

export type DocumentSnapshot = {
  documentId: string;
  fileName: string;
  revision: string;
  extractionLimitations: string[];
};

export type AgendaItem = {
  id: string;
  category: AgendaCategory;
  question: string;
  why: string;
  expectedAnswer: "amount" | "date_or_days" | "responsibility" | "condition" | "mixed";
  sourceRefs: EvidenceRef[];
  sourceLabel: "generated" | "edited" | "user_added" | "practice_suggestion";
};

export type AgendaSnapshot = {
  kind: "agenda_snapshot";
  revisionId: string;
  document: DocumentSnapshot;
  items: AgendaItem[];
  sharedContext: string;
  origin: "lease_report" | "synthetic_example" | "practice_revision";
  approval: null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseAgendaSnapshot(value: unknown): AgendaSnapshot | null {
  if (!isRecord(value) || value.kind !== "agenda_snapshot") return null;
  if (typeof value.revisionId !== "string" || !value.revisionId.trim()) return null;
  if (!isRecord(value.document)) return null;
  if (
    typeof value.document.documentId !== "string" ||
    typeof value.document.fileName !== "string" ||
    typeof value.document.revision !== "string" ||
    !Array.isArray(value.document.extractionLimitations)
  ) {
    return null;
  }
  if (!Array.isArray(value.items) || value.items.length === 0 || value.items.length > MAX_AGENDA_ITEMS) return null;
  if (typeof value.sharedContext !== "string" || value.sharedContext.length > MAX_CONTEXT_CHARS) return null;
  if (value.origin !== "lease_report" && value.origin !== "synthetic_example" && value.origin !== "practice_revision") return null;
  const items: AgendaItem[] = [];
  for (const raw of value.items) {
    if (!isRecord(raw)) return null;
    if (
      typeof raw.id !== "string" ||
      typeof raw.category !== "string" ||
      typeof raw.question !== "string" ||
      typeof raw.why !== "string" ||
      typeof raw.expectedAnswer !== "string" ||
      !Array.isArray(raw.sourceRefs) ||
      !["generated", "edited", "user_added", "practice_suggestion"].includes(String(raw.sourceLabel))
    ) {
      return null;
    }
    if (!raw.question.trim() || raw.question.length > 360 || raw.why.length > 600) return null;
    if (!["fees", "notice", "renewal", "utilities", "maintenance", "other"].includes(raw.category)) return null;
    if (!["amount", "date_or_days", "responsibility", "condition", "mixed"].includes(raw.expectedAnswer)) return null;
    const sourceRefs: EvidenceRef[] = [];
    for (const source of raw.sourceRefs) {
      if (!isRecord(source) || typeof source.page !== "number" || typeof source.quote !== "string" || !source.quote.trim()) return null;
      sourceRefs.push({
        page: source.page,
        quote: source.quote.trim(),
        ...(typeof source.evidenceId === "string" ? { evidenceId: source.evidenceId } : {}),
        ...(typeof source.startIndex === "number" ? { startIndex: source.startIndex } : {}),
        ...(typeof source.endIndex === "number" ? { endIndex: source.endIndex } : {}),
      });
    }
    items.push({
      id: raw.id.trim(),
      category: raw.category as AgendaCategory,
      question: raw.question.trim(),
      why: raw.why.trim(),
      expectedAnswer: raw.expectedAnswer as AgendaItem["expectedAnswer"],
      sourceRefs,
      sourceLabel: raw.sourceLabel as AgendaItem["sourceLabel"],
    });
  }
  return {
    kind: "agenda_snapshot",
    revisionId: value.revisionId.trim(),
    document: {
      documentId: value.document.documentId.trim(),
      fileName: value.document.fileName.trim(),
      revision: value.document.revision.trim(),
      extractionLimitations: value.document.extractionLimitations.filter((item): item is string => typeof item === "string"),
    },
    items,
    sharedContext: value.sharedContext.trim(),
    origin: value.origin,
    approval: null,
  };
}
