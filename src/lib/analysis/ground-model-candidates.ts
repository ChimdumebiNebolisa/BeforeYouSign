import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { containsBannedWording, type ModelReportCandidate } from "@/lib/analysis/model-candidate-schema";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { GroundingSummary } from "@/lib/analysis/pipeline/types";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";
import type { EvidenceRegistry } from "@/lib/evidence/types";
import { hydrateEvidence } from "@/lib/evidence/registry";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import { normalizeReportForCredibility } from "@/lib/analysis/report-normalization";

function hydrateEvidenceIds(
  registry: EvidenceRegistry,
  evidenceIds: string[] | undefined,
): { evidence: NonNullable<BeforeYouSignReport["moneyAndFees"][number]["evidence"]>; dropped: number } {
  if (!evidenceIds?.length) return { evidence: [], dropped: 1 };
  const evidence = [];
  let dropped = 0;
  const seen = new Set<string>();
  for (const id of evidenceIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const hydrated = hydrateEvidence(registry, id);
    if (hydrated) evidence.push(hydrated);
    else dropped += 1;
  }
  return { evidence, dropped };
}

export function groundModelCandidates(input: {
  candidate: ModelReportCandidate;
  registry: EvidenceRegistry;
  documentId: string;
  pages: ExtractedTextPage[];
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
}): {
  report: BeforeYouSignReport | null;
  groundingSummary: GroundingSummary;
} {
  let materialClaims = 0;
  let groundedClaims = 0;
  let droppedClaims = 0;

  if (containsBannedWording(input.candidate.summary) || containsBannedWording(input.candidate.riskReason)) {
    return {
      report: buildRuleOnlyFallbackReport({
        documentId: input.documentId,
        pages: input.pages,
        ruleBasedFindings: input.ruleBasedFindings,
        deterministicRisk: input.deterministicRisk,
        evidenceRegistry: input.registry,
      }),
      groundingSummary: { materialClaims: 1, groundedClaims: 0, droppedClaims: 1 },
    };
  }

  const moneyAndFees = [];
  for (const row of input.candidate.moneyAndFees) {
    materialClaims += 1;
    const { evidence, dropped } = hydrateEvidenceIds(input.registry, row.evidenceIds);
    droppedClaims += dropped;
    if (evidence.length === 0) continue;
    groundedClaims += 1;
    moneyAndFees.push({ label: row.label, value: row.value, evidence });
  }

  const deadlinesAndNotice = [];
  for (const row of input.candidate.deadlinesAndNotice) {
    materialClaims += 1;
    const { evidence, dropped } = hydrateEvidenceIds(input.registry, row.evidenceIds);
    droppedClaims += dropped;
    if (evidence.length === 0) continue;
    groundedClaims += 1;
    deadlinesAndNotice.push({ label: row.label, value: row.value, evidence });
  }

  const potentialRedFlags = [];
  for (const flag of input.candidate.potentialRedFlags) {
    materialClaims += 1;
    if (containsBannedWording(flag.title) || containsBannedWording(flag.explanation)) {
      droppedClaims += 1;
      continue;
    }
    const { evidence, dropped } = hydrateEvidenceIds(input.registry, flag.evidenceIds);
    droppedClaims += dropped;
    if (evidence.length === 0) continue;
    groundedClaims += 1;
    potentialRedFlags.push({
      id: flag.id,
      category: flag.category as BeforeYouSignReport["potentialRedFlags"][number]["category"],
      title: flag.title,
      severity: flag.severity,
      explanation: flag.explanation,
      whyItMatters: flag.whyItMatters,
      evidence,
    });
  }

  if (moneyAndFees.length === 0 && deadlinesAndNotice.length === 0 && potentialRedFlags.length === 0) {
    return {
      report: buildRuleOnlyFallbackReport({
        documentId: input.documentId,
        pages: input.pages,
        ruleBasedFindings: input.ruleBasedFindings,
        deterministicRisk: input.deterministicRisk,
        evidenceRegistry: input.registry,
      }),
      groundingSummary: { materialClaims, groundedClaims, droppedClaims },
    };
  }

  const report = normalizeReportForCredibility({
    summary: input.candidate.summary,
    whatYoureAgreeingTo: input.candidate.whatYoureAgreeingTo,
    riskLevel: input.candidate.riskLevel,
    riskReason: input.candidate.riskReason,
    moneyAndFees,
    deadlinesAndNotice,
    responsibilities: input.candidate.responsibilities,
    potentialRedFlags,
    questionsToAsk: input.candidate.questionsToAsk,
    nextSteps: input.candidate.nextSteps,
    missingOrUnclear: input.candidate.missingOrUnclear,
    disclaimer: input.candidate.disclaimer,
  });

  return {
    report,
    groundingSummary: { materialClaims, groundedClaims, droppedClaims },
  };
}
