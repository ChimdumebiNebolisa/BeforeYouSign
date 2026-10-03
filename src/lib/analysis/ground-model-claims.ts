import { containsBannedWording } from "@/lib/analysis/model-safety";
import type { ModelLeaseCandidate, ModelLeaseClaim } from "@/lib/analysis/model-candidate-schema";
import { isEvidenceRelevantToFindingCategory } from "@/lib/analysis/evidence-relevance";
import { normalizeReportForCredibility } from "@/lib/analysis/report-normalization";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import { hydrateEvidence } from "@/lib/evidence/registry";
import type { EvidenceRegistry } from "@/lib/evidence/types";

const STOP_WORDS = new Set([
  "about", "after", "before", "being", "could", "every", "from", "have", "lease",
  "might", "other", "should", "tenant", "that", "their", "there", "these", "this",
  "through", "under", "when", "which", "with", "would",
]);

const NEGATION_WORDS = /\b(?:no|not|never|without|prohibit(?:ed|s)?|forbid(?:den|s)?)\b/i;

function normalizedText(text: string): string {
  return text.toLowerCase().replace(/,/g, "").replace(/\s+/g, " ").trim();
}

function normalizedToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower === "electricity") return "electric";
  if (lower.endsWith("ies") && lower.length > 5) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("ing") && lower.length > 6) return lower.slice(0, -3);
  if (lower.endsWith("ed") && lower.length > 5) return lower.slice(0, -2);
  if (lower.endsWith("s") && lower.length > 4) return lower.slice(0, -1);
  return lower;
}

function significantTokens(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z]{4,}/g) ?? [])
      .map(normalizedToken)
      .filter((token) => !STOP_WORDS.has(token)),
  );
}

function numbersAreSupported(claimText: string, evidenceText: string): boolean {
  const claim = normalizedText(claimText);
  const evidence = normalizedText(evidenceText);
  const evidenceNumbers = new Set(evidence.match(/\d+(?:\.\d+)?/g) ?? []);
  const claimNumbers = claim.match(/\d+(?:\.\d+)?/g) ?? [];
  if (!claimNumbers.every((number) => evidenceNumbers.has(number))) return false;

  const measurementKey = (match: RegExpMatchArray) =>
    `${match[1]}:${match[2]?.replace(/s$/, "")}`;
  const evidenceMeasurements = new Set(
    [...evidence.matchAll(/(\d+(?:\.\d+)?)\s*(%|days?|hours?|months?|years?)\b/g)].map(measurementKey),
  );
  return [...claim.matchAll(/(\d+(?:\.\d+)?)\s*(%|days?|hours?|months?|years?)\b/g)]
    .map(measurementKey)
    .every((measurement) => evidenceMeasurements.has(measurement));
}

function wordingIsSupported(claimText: string, evidenceText: string): boolean {
  if (NEGATION_WORDS.test(claimText) !== NEGATION_WORDS.test(evidenceText)) return false;
  const claimTokens = significantTokens(claimText);
  const evidenceTokens = significantTokens(evidenceText);
  if (claimTokens.size === 0) return false;
  const overlap = [...claimTokens].filter((token) => evidenceTokens.has(token)).length;
  const minimumOverlap = claimTokens.size <= 3 ? 1 : 2;
  return overlap >= minimumOverlap;
}

function kindMatchesCategory(claim: ModelLeaseClaim): boolean {
  if (claim.kind === "money") {
    return ["fees", "pets", "utilities", "termination"].includes(claim.category);
  }
  if (claim.kind === "deadline") {
    return ["notice", "renewal", "termination", "entry"].includes(claim.category);
  }
  return true;
}

function claimText(claim: ModelLeaseClaim): string {
  return `${claim.label} ${claim.value} ${claim.explanation}`;
}

export function modelClaimSupportChecks(claim: ModelLeaseClaim, quote: string) {
  const text = claimText(claim);
  return {
    kindMatchesCategory: kindMatchesCategory(claim),
    wordingIsSafe: !containsBannedWording(`${text} ${claim.whyItMatters}`),
    categoryIsRelevant: isEvidenceRelevantToFindingCategory(claim.category, quote),
    numbersAreSupported: numbersAreSupported(text, quote),
    wordingIsSupported: wordingIsSupported(text, quote),
  };
}

function isSupportedClaim(claim: ModelLeaseClaim, quote: string): boolean {
  return Object.values(modelClaimSupportChecks(claim, quote)).every(Boolean);
}

function rowKey(row: BeforeYouSignReport["moneyAndFees"][number]): string {
  const evidenceId = row.evidence?.[0]?.evidenceId ?? "";
  return `${row.label.toLowerCase()}::${row.value.toLowerCase()}::${evidenceId}`;
}

export type GroundingSummary = {
  materialClaims: number;
  groundedClaims: number;
  droppedClaims: number;
};

export function groundModelClaims(input: {
  candidate: ModelLeaseCandidate;
  registry: EvidenceRegistry;
  baseReport: BeforeYouSignReport;
}): { report: BeforeYouSignReport; groundingSummary: GroundingSummary } {
  const moneyAndFees = [...input.baseReport.moneyAndFees];
  const deadlinesAndNotice = [...input.baseReport.deadlinesAndNotice];
  const potentialRedFlags = [...input.baseReport.potentialRedFlags];
  const moneyKeys = new Set(moneyAndFees.map(rowKey));
  const deadlineKeys = new Set(deadlinesAndNotice.map(rowKey));
  const findingKeys = new Set(
    potentialRedFlags.flatMap((finding) => finding.evidence.map((evidence) => `${finding.category}::${evidence.evidenceId ?? ""}`)),
  );
  let groundedClaims = 0;

  for (const claim of input.candidate.claims) {
    const evidence = hydrateEvidence(input.registry, claim.evidenceId);
    if (!evidence || !isSupportedClaim(claim, evidence.quote)) continue;

    if (claim.kind === "money") {
      const row = { label: claim.label, value: claim.value, evidence: [evidence] };
      const key = rowKey(row);
      if (moneyKeys.has(key)) continue;
      moneyKeys.add(key);
      moneyAndFees.push(row);
      groundedClaims += 1;
      continue;
    }

    if (claim.kind === "deadline") {
      const row = { label: claim.label, value: claim.value, evidence: [evidence] };
      const key = rowKey(row);
      if (deadlineKeys.has(key)) continue;
      deadlineKeys.add(key);
      deadlinesAndNotice.push(row);
      groundedClaims += 1;
      continue;
    }

    const findingKey = `${claim.category}::${evidence.evidenceId}`;
    if (findingKeys.has(findingKey)) continue;
    findingKeys.add(findingKey);
    potentialRedFlags.push({
      id: `model-${claim.id}`,
      category: claim.category,
      title: claim.label,
      severity: claim.severity,
      provenance: "model",
      explanation: claim.explanation,
      whyItMatters: claim.whyItMatters,
      evidence: [evidence],
    });
    groundedClaims += 1;
  }

  const materialClaims = input.candidate.claims.length;
  return {
    report: normalizeReportForCredibility({
      ...input.baseReport,
      moneyAndFees,
      deadlinesAndNotice,
      potentialRedFlags: potentialRedFlags.slice(0, 8),
    }),
    groundingSummary: {
      materialClaims,
      groundedClaims,
      droppedClaims: materialClaims - groundedClaims,
    },
  };
}
