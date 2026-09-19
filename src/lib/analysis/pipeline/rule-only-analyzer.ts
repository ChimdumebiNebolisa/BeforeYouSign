import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import type { AnalysisEngine, AnalysisEngineResult } from "@/lib/analysis/pipeline/types";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildEvidenceIndex } from "@/lib/evidence/index";

function withEvidenceIndex(
  registry: ReturnType<typeof createEvidenceRegistry>,
  result: Omit<AnalysisEngineResult, "evidenceIndex">,
): AnalysisEngineResult {
  return {
    ...result,
    evidenceIndex: buildEvidenceIndex(registry),
  };
}

export function createRuleOnlyAnalyzer(): AnalysisEngine {
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
    });
  };
}
