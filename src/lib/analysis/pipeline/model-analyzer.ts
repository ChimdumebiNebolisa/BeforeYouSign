import { runStructuredLeaseAnalysis } from "@/lib/analysis/gemini-report";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { groundModelCandidates } from "@/lib/analysis/ground-model-candidates";
import { parseModelReportCandidate } from "@/lib/analysis/model-candidate-schema";
import type { ModelAnalyzer, ModelAnalyzerResult } from "@/lib/analysis/pipeline/types";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { getBysAiKey } from "@/lib/env/bys-ai-key";

const isDev = process.env.NODE_ENV === "development";

export function createDefaultModelAnalyzer(): ModelAnalyzer {
  return async ({ document, deterministic }) => {
    const registry = createEvidenceRegistry(document.documentId, document.pages);
    const apiKey = getBysAiKey();

    if (!apiKey?.trim()) {
      return {
        report: null,
        reportError:
          "The AI summary isn't available right now, but key lease details are still shown below.",
        mode: "unavailable",
        reportDebug: null,
      };
    }

    const evidenceCatalog = registry.chunks
      .slice(0, 200)
      .map((chunk) => ({ id: chunk.id, page: chunk.page, text: chunk.text }));

    const ai = await runStructuredLeaseAnalysis({
      apiKey: apiKey.trim(),
      leaseText: deterministic.fullLeaseText,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
      texasRenterFindings: deterministic.texasRenterFindings,
      evidenceCatalog,
    });

    if (!ai.ok) {
      const fallbackReport = buildRuleOnlyFallbackReport({
        documentId: document.documentId,
        ruleBasedFindings: deterministic.ruleBasedFindings,
        deterministicRisk: deterministic.deterministicRisk,
        evidenceRegistry: registry,
      });

      return {
        report: fallbackReport,
        reportError: null,
        mode: "rules_only",
        reportDebug: isDev ? { failureStage: ai.failureStage } : null,
      };
    }

    const candidate = parseModelReportCandidate(ai.rawParsed);
    if (!candidate) {
      const fallbackReport = buildRuleOnlyFallbackReport({
        documentId: document.documentId,
        ruleBasedFindings: deterministic.ruleBasedFindings,
        deterministicRisk: deterministic.deterministicRisk,
        evidenceRegistry: registry,
      });
      return {
        report: fallbackReport,
        reportError: null,
        mode: "rules_only",
        reportDebug: isDev ? { failureStage: "schema_validation" } : null,
      };
    }

    const grounded = groundModelCandidates({
      candidate,
      registry,
      documentId: document.documentId,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
    });

    return {
      report: grounded.report,
      reportError: null,
      mode: grounded.groundingSummary.groundedClaims > 0 ? "model_grounded" : "rules_only",
      groundingSummary: grounded.groundingSummary,
      reportDebug: null,
    };
  };
}
