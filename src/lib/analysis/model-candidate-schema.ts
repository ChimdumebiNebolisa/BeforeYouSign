import type { FindingCategory, FindingSeverity } from "@/lib/analysis/schema";

export type ModelClaimKind = "money" | "deadline" | "concern";

export type ModelLeaseClaim = {
  id: string;
  kind: ModelClaimKind;
  category: Exclude<FindingCategory, "other">;
  label: string;
  value: string;
  severity: FindingSeverity;
  explanation: string;
  whyItMatters: string;
  evidenceId: string;
};

export type ModelLeaseCandidate = {
  claims: ModelLeaseClaim[];
};

const CLAIM_KINDS = new Set<ModelClaimKind>(["money", "deadline", "concern"]);
const CLAIM_CATEGORIES = new Set<Exclude<FindingCategory, "other">>([
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
]);
const SEVERITIES = new Set<FindingSeverity>(["minor", "moderate", "critical"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  const allowedKeys = new Set(allowed);
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

function parseClaim(value: unknown): ModelLeaseClaim | null {
  if (!isRecord(value)) return null;
  if (!hasOnlyKeys(value, [
    "id",
    "kind",
    "category",
    "label",
    "value",
    "severity",
    "explanation",
    "whyItMatters",
    "evidenceId",
  ])) return null;
  if (!isBoundedString(value.id, 80)) return null;
  if (!CLAIM_KINDS.has(value.kind as ModelClaimKind)) return null;
  if (!CLAIM_CATEGORIES.has(value.category as Exclude<FindingCategory, "other">)) return null;
  if (!isBoundedString(value.label, 120)) return null;
  if (!isBoundedString(value.value, 240)) return null;
  if (!SEVERITIES.has(value.severity as FindingSeverity)) return null;
  if (!isBoundedString(value.explanation, 360)) return null;
  if (!isBoundedString(value.whyItMatters, 280)) return null;
  if (!isBoundedString(value.evidenceId, 160)) return null;

  return {
    id: value.id.trim(),
    kind: value.kind as ModelClaimKind,
    category: value.category as Exclude<FindingCategory, "other">,
    label: value.label.trim(),
    value: value.value.trim(),
    severity: value.severity as FindingSeverity,
    explanation: value.explanation.trim(),
    whyItMatters: value.whyItMatters.trim(),
    evidenceId: value.evidenceId.trim(),
  };
}

export function parseModelLeaseCandidate(value: unknown): ModelLeaseCandidate | null {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["claims"]) ||
    !Array.isArray(value.claims) ||
    value.claims.length > 16
  ) {
    return null;
  }

  const claims: ModelLeaseClaim[] = [];
  for (const rawClaim of value.claims) {
    const claim = parseClaim(rawClaim);
    if (!claim) return null;
    claims.push(claim);
  }

  return { claims };
}
