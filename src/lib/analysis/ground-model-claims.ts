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
const FINANCIAL_WORDS = /\b(?:rent|deposit|fees?|charges?|costs?|payment|pay(?:s|ing|able)?|paid|refund(?:ed|able)?|interest|penalt(?:y|ies))\b|\$/i;
const TEMPORAL_WORDS = /\b(?:due|deadline|notice|notify|notification|before|after|within|days?|hours?|months?|years?|renew(?:s|ed|ing|al)?|terminat(?:e|es|ed|ion)|vacate|move[- ]?out)\b/i;

const PARTY_PATTERNS = {
  renter: /\b(?:tenant|resident|renter|occupant)\b/i,
  housingProvider: /\b(?:landlord|owner|management|property manager)\b/i,
} as const;

const MODALITY_PATTERNS = {
  prohibited: /\b(?:no|not|never|prohibit(?:ed|s)?|forbid(?:den|s)?|disallow(?:ed|s)?|may not)\b/i,
  required: /\b(?:must|shall|required?|responsib(?:le|ility)|has to|need(?:s)? to)\b/i,
  permitted: /\b(?:may|can|allow(?:ed|s)?|permit(?:ted|s)?)\b/i,
  conditional: /\b(?:if|unless|subject to|only (?:if|with)|approv(?:al|ed)|consent)\b/i,
} as const;

const CATEGORY_ONLY_TOKENS = new Set([
  "access", "animal", "assign", "entry", "fee", "guest", "maintain", "maintenance",
  "notice", "pet", "renewal", "repair", "sublease", "sublet", "terminate", "termination",
  "utilities", "utility",
]);

const TOKEN_ALIASES: Record<string, string> = {
  allowed: "permit",
  allowing: "permit",
  approval: "approval",
  approved: "approval",
  consent: "approval",
  electric: "electric",
  electricity: "electric",
  landlord: "housingprovider",
  management: "housingprovider",
  manager: "housingprovider",
  must: "obligation",
  occupant: "renter",
  owner: "housingprovider",
  permitted: "permit",
  prohibited: "prohibit",
  renter: "renter",
  required: "obligation",
  resident: "renter",
  responsible: "obligation",
  tenant: "renter",
};

function normalizedText(text: string): string {
  return text.toLowerCase().replace(/,/g, "").replace(/\s+/g, " ").trim();
}

function normalizedToken(token: string): string {
  const lower = token.toLowerCase();
  if (TOKEN_ALIASES[lower]) return TOKEN_ALIASES[lower];
  if (lower.endsWith("ies") && lower.length > 5) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith("ing") && lower.length > 6) return lower.slice(0, -3);
  if (lower.endsWith("ed") && lower.length > 5) return lower.slice(0, -2);
  if (lower.endsWith("s") && lower.length > 4) return lower.slice(0, -1);
  return TOKEN_ALIASES[lower] ?? lower;
}

function significantTokens(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z]{4,}/g) ?? [])
      .map(normalizedToken)
      .filter((token) => !STOP_WORDS.has(token) && !CATEGORY_ONLY_TOKENS.has(token)),
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
  const minimumOverlap = Math.min(2, claimTokens.size);
  return overlap >= minimumOverlap;
}

function partiesAreSupported(claimText: string, evidenceText: string): boolean {
  return Object.values(PARTY_PATTERNS).every(
    (pattern) => !pattern.test(claimText) || pattern.test(evidenceText),
  );
}

function modalitiesAreSupported(claimText: string, evidenceText: string): boolean {
  return Object.values(MODALITY_PATTERNS).every(
    (pattern) => !pattern.test(claimText) || pattern.test(evidenceText),
  );
}

function kindPolicyIsSupported(claim: ModelLeaseClaim, text: string, quote: string): boolean {
  if (claim.kind === "money") {
    return FINANCIAL_WORDS.test(text) && FINANCIAL_WORDS.test(quote);
  }
  if (claim.kind === "deadline") {
    return TEMPORAL_WORDS.test(text) && TEMPORAL_WORDS.test(quote);
  }
  return partiesAreSupported(text, quote) && modalitiesAreSupported(text, quote);
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
    partiesAreSupported: partiesAreSupported(text, quote),
    modalitiesAreSupported: modalitiesAreSupported(text, quote),
    kindPolicyIsSupported: kindPolicyIsSupported(claim, text, quote),
    wordingIsSupported: wordingIsSupported(text, quote),
  };
}

export type ModelClaimRejectionReason =
  | "missing_evidence"
  | "kind_category_mismatch"
  | "unsafe_wording"
  | "category_mismatch"
  | "unsupported_number"
  | "party_mismatch"
  | "modality_mismatch"
  | "kind_policy_mismatch"
  | "insufficient_semantic_support"
  | "duplicate_claim";

export function evaluateModelClaimSupport(
  claim: ModelLeaseClaim,
  quote: string,
): { supported: boolean; reasons: ModelClaimRejectionReason[] } {
  const checks = modelClaimSupportChecks(claim, quote);
  const reasons: ModelClaimRejectionReason[] = [];
  if (!checks.kindMatchesCategory) reasons.push("kind_category_mismatch");
  if (!checks.wordingIsSafe) reasons.push("unsafe_wording");
  if (!checks.categoryIsRelevant) reasons.push("category_mismatch");
  if (!checks.numbersAreSupported) reasons.push("unsupported_number");
  if (!checks.partiesAreSupported) reasons.push("party_mismatch");
  if (!checks.modalitiesAreSupported) reasons.push("modality_mismatch");
  if (!checks.kindPolicyIsSupported) reasons.push("kind_policy_mismatch");
  if (!checks.wordingIsSupported) reasons.push("insufficient_semantic_support");
  return { supported: reasons.length === 0, reasons };
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
}): {
  report: BeforeYouSignReport;
  groundingSummary: GroundingSummary;
  rejectionCounts: Partial<Record<ModelClaimRejectionReason, number>>;
} {
  const moneyAndFees = [...input.baseReport.moneyAndFees];
  const deadlinesAndNotice = [...input.baseReport.deadlinesAndNotice];
  const potentialRedFlags = [...input.baseReport.potentialRedFlags];
  const moneyKeys = new Set(moneyAndFees.map(rowKey));
  const deadlineKeys = new Set(deadlinesAndNotice.map(rowKey));
  const findingKeys = new Set(
    potentialRedFlags.flatMap((finding) => finding.evidence.map((evidence) => `${finding.category}::${evidence.evidenceId ?? ""}`)),
  );
  let groundedClaims = 0;
  const rejectionCounts: Partial<Record<ModelClaimRejectionReason, number>> = {};
  const reject = (reason: ModelClaimRejectionReason) => {
    rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1;
  };

  for (const claim of input.candidate.claims) {
    const evidence = hydrateEvidence(input.registry, claim.evidenceId);
    if (!evidence) {
      reject("missing_evidence");
      continue;
    }
    const support = evaluateModelClaimSupport(claim, evidence.quote);
    if (!support.supported) {
      support.reasons.forEach(reject);
      continue;
    }

    if (claim.kind === "money") {
      const row = { label: claim.label, value: claim.value, evidence: [evidence] };
      const key = rowKey(row);
      if (moneyKeys.has(key)) {
        reject("duplicate_claim");
        continue;
      }
      moneyKeys.add(key);
      moneyAndFees.push(row);
      groundedClaims += 1;
      continue;
    }

    if (claim.kind === "deadline") {
      const row = { label: claim.label, value: claim.value, evidence: [evidence] };
      const key = rowKey(row);
      if (deadlineKeys.has(key)) {
        reject("duplicate_claim");
        continue;
      }
      deadlineKeys.add(key);
      deadlinesAndNotice.push(row);
      groundedClaims += 1;
      continue;
    }

    const findingKey = `${claim.category}::${evidence.evidenceId}`;
    if (findingKeys.has(findingKey)) {
      reject("duplicate_claim");
      continue;
    }
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
    rejectionCounts,
  };
}
