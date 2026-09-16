import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import type { ModelAnalyzer, ModelAnalyzerResult } from "@/lib/analysis/pipeline/types";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildEvidenceIndex } from "@/lib/evidence/index";

function withEvidenceIndex(
  registry: ReturnType<typeof createEvidenceRegistry>,
  result: Omit<ModelAnalyzerResult, "evidenceIndex">,
): ModelAnalyzerResult {
  return {
    ...result,
    evidenceIndex: buildEvidenceIndex(registry),
  };
}

export function createDefaultModelAnalyzer(): ModelAnalyzer {
  return async ({ document, deterministic }) => {
    const registry = createEvidenceRegistry(document.documentId, document.pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: document.documentId,
      pages: document.pages,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
      evidenceRegistry: registry,
    });
    return withEvidenceIndex(registry, {
      report,
      reportError: null,
      mode: "rules_only",
      groundingSummary: { materialClaims: 0, groundedClaims: 0, droppedClaims: 0 },
      reportDebug: null,
    });
  };
}
