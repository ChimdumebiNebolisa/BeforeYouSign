import type { EvidenceRef } from "@/lib/analysis/schema";

export type ModelReportCandidate = {
  summary: string;
  whatYoureAgreeingTo: string[];
  riskLevel: "low" | "medium" | "high";
  riskReason: string;
  moneyAndFees: { label: string; value: string; evidenceIds?: string[] }[];
  deadlinesAndNotice: { label: string; value: string; evidenceIds?: string[] }[];
  responsibilities: string[];
  potentialRedFlags: {
    id: string;
    category: string;
    title: string;
    severity: "minor" | "moderate" | "critical";
    explanation: string;
    whyItMatters: string;
    evidenceIds: string[];
  }[];
  questionsToAsk: string[];
  nextSteps: string[];
  missingOrUnclear: string[];
  disclaimer: string;
};

const BANNED_WORDS = [
  /\billegal\b/i,
  /\bvalid\b/i,
  /\benforceable\b/i,
  /\bunenforceable\b/i,
  /\bunsafe\b/i,
  /\bshould sign\b/i,
  /\bshould not sign\b/i,
];

const FINDING_CATEGORIES = new Set([
  "fees",
  "renewal",
  "notice",
  "maintenance",
  "utilities",
  "guests",
  "pets",
  "subletting",
  "termination",
  "entry",
  "other",
]);

export function containsBannedWording(text: string): boolean {
  const normalized = text.replace(/\binvalid\w*/gi, "");
  return BANNED_WORDS.some((pattern) => pattern.test(normalized));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEvidenceRow(value: unknown): value is { label: string; value: string; evidenceIds?: string[] } {
  return (
    isRecord(value) &&
    typeof value.label === "string" &&
    typeof value.value === "string" &&
    (value.evidenceIds === undefined || isStringArray(value.evidenceIds))
  );
}

export function parseModelReportCandidate(raw: unknown): ModelReportCandidate | null {
  if (!isRecord(raw)) return null;
  const o = raw as Record<string, unknown>;

  if (
    typeof o.summary !== "string" ||
    !isStringArray(o.whatYoureAgreeingTo) ||
    !["low", "medium", "high"].includes(String(o.riskLevel)) ||
    typeof o.riskReason !== "string" ||
    !Array.isArray(o.moneyAndFees) ||
    !o.moneyAndFees.every(isEvidenceRow) ||
    !Array.isArray(o.deadlinesAndNotice) ||
    !o.deadlinesAndNotice.every(isEvidenceRow) ||
    !isStringArray(o.responsibilities) ||
    !Array.isArray(o.potentialRedFlags) ||
    !o.potentialRedFlags.every((flag) => {
      if (!isRecord(flag)) return false;
      return (
        typeof flag.id === "string" &&
        typeof flag.category === "string" &&
        FINDING_CATEGORIES.has(flag.category) &&
        typeof flag.title === "string" &&
        ["minor", "moderate", "critical"].includes(String(flag.severity)) &&
        typeof flag.explanation === "string" &&
        typeof flag.whyItMatters === "string" &&
        isStringArray(flag.evidenceIds) &&
        flag.evidenceIds.length > 0
      );
    }) ||
    !isStringArray(o.questionsToAsk) ||
    !isStringArray(o.nextSteps) ||
    !isStringArray(o.missingOrUnclear) ||
    typeof o.disclaimer !== "string"
  ) {
    return null;
  }

  return o as unknown as ModelReportCandidate;
}

export function toLegacyEvidence(evidence: EvidenceRef & { evidenceId?: string }) {
  return {
    page: evidence.page,
    quote: evidence.quote,
    ...(evidence.startIndex !== undefined ? { startIndex: evidence.startIndex } : {}),
    ...(evidence.endIndex !== undefined ? { endIndex: evidence.endIndex } : {}),
    ...(evidence.evidenceId ? { evidenceId: evidence.evidenceId } : {}),
  };
}
