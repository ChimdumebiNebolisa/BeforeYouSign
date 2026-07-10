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

export function containsBannedWording(text: string): boolean {
  const normalized = text.replace(/\binvalid\w*/gi, "");
  return BANNED_WORDS.some((pattern) => pattern.test(normalized));
}

export function parseModelReportCandidate(raw: unknown): ModelReportCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.summary !== "string") return null;
  if (!Array.isArray(o.moneyAndFees) || !Array.isArray(o.potentialRedFlags)) return null;
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
