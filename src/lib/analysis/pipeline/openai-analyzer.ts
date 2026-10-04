import { groundModelClaims } from "@/lib/analysis/ground-model-claims";
import { parseModelLeaseCandidate } from "@/lib/analysis/model-candidate-schema";
import { runOpenAiLeaseClaims } from "@/lib/analysis/openai-report";
import { buildEvidenceIndex } from "@/lib/evidence/index";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildRuleOnlyAnalysisResult } from "@/lib/analysis/pipeline/rule-only-analyzer";
import type { AnalysisEngine } from "@/lib/analysis/pipeline/types";

export function createOpenAiAnalyzer(): AnalysisEngine {
  return async ({ document, deterministic }) => {
    const registry = createEvidenceRegistry(document.documentId, document.pages);
    const fallback = buildRuleOnlyAnalysisResult({ document, deterministic }, registry);
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (process.env.BYS_AI_ENABLED === "0" || !apiKey) {
      return fallback;
    }

    const result = await runOpenAiLeaseClaims({
      apiKey,
      evidenceCatalog: registry.chunks.map((chunk) => ({
        id: chunk.id,
        page: chunk.page,
        text: chunk.text,
      })),
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
      texasRenterFindings: deterministic.texasRenterFindings,
    });
    if (!result.ok) return fallback;

    const candidate = parseModelLeaseCandidate(result.rawCandidate);
    if (!candidate) return fallback;

    const grounded = groundModelClaims({
      candidate,
      registry,
      baseReport: fallback.report!,
    });

    return {
      ...fallback,
      report: grounded.report,
      mode: grounded.groundingSummary.groundedClaims > 0 ? "model_grounded" : "rules_only",
      groundingSummary: grounded.groundingSummary,
      groundingRejectionCounts: grounded.rejectionCounts,
      evidenceIndex: buildEvidenceIndex(registry),
    };
  };
}
