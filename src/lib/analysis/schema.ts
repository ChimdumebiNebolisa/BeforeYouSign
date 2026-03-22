import { parseGeminiModelJson } from "@/lib/analysis/model-json";

export type RiskLevel = "low" | "medium" | "high";

export type EvidenceRef = {
  page: number;
  quote: string;
  startIndex?: number;
  endIndex?: number;
};

export type FindingCategory =
  | "fees"
  | "renewal"
  | "notice"
  | "maintenance"
  | "utilities"
  | "guests"
  | "pets"
  | "subletting"
  | "termination"
  | "entry"
  | "other";

export type FindingSeverity = "minor" | "moderate" | "critical";

export type Finding = {
  id: string;
  category: FindingCategory;
  title: string;
  severity: FindingSeverity;
  explanation: string;
  whyItMatters: string;
  evidence: EvidenceRef[];
};

export type BeforeYouSignReport = {
  summary: string;
  whatYoureAgreeingTo: string[];
  riskLevel: RiskLevel;
  riskReason: string;
  moneyAndFees: { label: string; value: string; evidence?: EvidenceRef[] }[];
  deadlinesAndNotice: { label: string; value: string; evidence?: EvidenceRef[] }[];
  responsibilities: string[];
  potentialRedFlags: Finding[];
  questionsToAsk: string[];
  nextSteps: string[];
  missingOrUnclear: string[];
  disclaimer: string;
};

const FINDING_CATEGORIES = new Set<FindingCategory>([
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

const SEVERITIES = new Set<FindingSeverity>(["minor", "moderate", "critical"]);

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isRiskLevel(v: unknown): v is RiskLevel {
  return v === "low" || v === "medium" || v === "high";
}

function parseEvidenceRef(v: unknown): EvidenceRef | null {
  if (!v || typeof v !== "object") {
    return null;
  }
  const o = v as Record<string, unknown>;
  if (typeof o.page !== "number" || o.page < 1 || !Number.isFinite(o.page)) {
    return null;
  }
  if (!isNonEmptyString(o.quote)) {
    return null;
  }
  const ref: EvidenceRef = { page: o.page, quote: o.quote.trim() };
  if (typeof o.startIndex === "number" && Number.isFinite(o.startIndex)) {
    ref.startIndex = o.startIndex;
  }
  if (typeof o.endIndex === "number" && Number.isFinite(o.endIndex)) {
    ref.endIndex = o.endIndex;
  }
  return ref;
}

function parseFinding(v: unknown): Finding | null {
  if (!v || typeof v !== "object") {
    return null;
  }
  const o = v as Record<string, unknown>;
  if (!isNonEmptyString(o.id)) return null;
  if (!FINDING_CATEGORIES.has(o.category as FindingCategory)) return null;
  if (!isNonEmptyString(o.title)) return null;
  if (!SEVERITIES.has(o.severity as FindingSeverity)) return null;
  if (!isNonEmptyString(o.explanation)) return null;
  if (!isNonEmptyString(o.whyItMatters)) return null;
  if (!Array.isArray(o.evidence)) return null;
  const evidence: EvidenceRef[] = [];
  for (let i = 0; i < o.evidence.length; i++) {
    const ref = parseEvidenceRef(o.evidence[i]);
    if (!ref) return null;
    evidence.push(ref);
  }
  return {
    id: o.id.trim(),
    category: o.category as FindingCategory,
    title: o.title.trim(),
    severity: o.severity as FindingSeverity,
    explanation: o.explanation.trim(),
    whyItMatters: o.whyItMatters.trim(),
    evidence,
  };
}

function parseLabeledRows(v: unknown): { label: string; value: string; evidence?: EvidenceRef[] }[] | null {
  if (!Array.isArray(v)) return null;
  const out: { label: string; value: string; evidence?: EvidenceRef[] }[] = [];
  for (let i = 0; i < v.length; i++) {
    const row = v[i];
    if (!row || typeof row !== "object") return null;
    const o = row as Record<string, unknown>;
    if (!isNonEmptyString(o.label) || !isNonEmptyString(o.value)) return null;
    const item: { label: string; value: string; evidence?: EvidenceRef[] } = {
      label: o.label.trim(),
      value: o.value.trim(),
    };
    if (o.evidence !== undefined) {
      if (!Array.isArray(o.evidence)) return null;
      const ev: EvidenceRef[] = [];
      for (let j = 0; j < o.evidence.length; j++) {
        const ref = parseEvidenceRef(o.evidence[j]);
        if (!ref) return null;
        ev.push(ref);
      }
      item.evidence = ev;
    }
    out.push(item);
  }
  return out;
}

function parseStringArray(v: unknown, allowEmpty = true): string[] | null {
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (let i = 0; i < v.length; i++) {
    if (!isNonEmptyString(v[i])) return null;
    out.push((v[i] as string).trim());
  }
  if (!allowEmpty && out.length === 0) return null;
  return out;
}

export function parseBeforeYouSignReportJson(raw: unknown): BeforeYouSignReport | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;

  if (!isNonEmptyString(o.summary)) return null;
  const whatYoureAgreeingTo = parseStringArray(o.whatYoureAgreeingTo, true);
  if (!whatYoureAgreeingTo) return null;
  if (!isRiskLevel(o.riskLevel)) return null;
  if (!isNonEmptyString(o.riskReason)) return null;

  const moneyAndFees = parseLabeledRows(o.moneyAndFees);
  if (!moneyAndFees) return null;
  const deadlinesAndNotice = parseLabeledRows(o.deadlinesAndNotice);
  if (!deadlinesAndNotice) return null;

  const responsibilities = parseStringArray(o.responsibilities, true);
  if (!responsibilities) return null;

  if (!Array.isArray(o.potentialRedFlags)) return null;
  const potentialRedFlags: Finding[] = [];
  for (let i = 0; i < o.potentialRedFlags.length; i++) {
    const f = parseFinding(o.potentialRedFlags[i]);
    if (!f) return null;
    potentialRedFlags.push(f);
  }

  const questionsToAsk = parseStringArray(o.questionsToAsk, true);
  if (!questionsToAsk) return null;
  const nextSteps = parseStringArray(o.nextSteps, true);
  if (!nextSteps) return null;

  const missingOrUnclear = parseStringArray(o.missingOrUnclear, true);
  if (!missingOrUnclear) return null;
  if (!isNonEmptyString(o.disclaimer)) return null;

  return {
    summary: o.summary.trim(),
    whatYoureAgreeingTo,
    riskLevel: o.riskLevel,
    riskReason: o.riskReason.trim(),
    moneyAndFees,
    deadlinesAndNotice,
    responsibilities,
    potentialRedFlags,
    questionsToAsk,
    nextSteps,
    missingOrUnclear,
    disclaimer: o.disclaimer.trim(),
  };
}

export function tryParseModelJson(text: string): unknown | null {
  const parsed = parseGeminiModelJson(text);
  return parsed.ok ? parsed.value : null;
}
