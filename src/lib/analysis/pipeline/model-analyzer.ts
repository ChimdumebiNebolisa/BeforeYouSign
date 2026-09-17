import { runStructuredLeaseAnalysis } from "@/lib/analysis/gemini-report";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { groundModelCandidates } from "@/lib/analysis/ground-model-candidates";
import { parseModelReportCandidate } from "@/lib/analysis/model-candidate-schema";
import type { ModelAnalyzer, ModelAnalyzerResult } from "@/lib/analysis/pipeline/types";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildEvidenceIndex } from "@/lib/evidence/index";
import { getBysAiKey } from "@/lib/env/bys-ai-key";

const isDev = process.env.NODE_ENV === "development";

function withEvidenceIndex(
  registry: ReturnType<typeof createEvidenceRegistry>,
  result: Omit<ModelAnalyzerResult, "evidenceIndex">,
): ModelAnalyzerResult {
  return {
    ...result,
    evidenceIndex: buildEvidenceIndex(registry),
  };
}

function buildDeterministicFallback(
  document: Parameters<ModelAnalyzer>[0]["document"],
  deterministic: Parameters<ModelAnalyzer>[0]["deterministic"],
): ModelAnalyzerResult {
  const registry = createEvidenceRegistry(document.documentId, document.pages);
  return withEvidenceIndex(registry, {
    report: buildRuleOnlyFallbackReport({
      documentId: document.documentId,
      pages: document.pages,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
      evidenceRegistry: registry,
    }),
    reportError: null,
    mode: "rules_only",
    groundingSummary: { materialClaims: 0, groundedClaims: 0, droppedClaims: 0 },
    reportDebug: null,
  });
}

export function createDefaultModelAnalyzer(): ModelAnalyzer {
  return async ({ document, deterministic }) => {
    const registry = createEvidenceRegistry(document.documentId, document.pages);
    const apiKey = getBysAiKey();

    if (!apiKey?.trim()) {
      const fallback = buildDeterministicFallback(document, deterministic);
      return { ...fallback, mode: "unavailable" };
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
      const fallbackReport = buildDeterministicFallback(document, deterministic);

      return {
        ...fallbackReport,
        mode: "rules_only",
        reportDebug: isDev ? { failureStage: ai.failureStage } : null,
      };
    }

    const candidate = parseModelReportCandidate(ai.rawParsed);
    if (!candidate) {
      const fallback = buildDeterministicFallback(document, deterministic);
      return {
        ...fallback,
        mode: "rules_only",
        reportDebug: isDev ? { failureStage: "schema_validation" } : null,
      };
    }

    const grounded = groundModelCandidates({
      candidate,
      registry,
      documentId: document.documentId,
      pages: document.pages,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
    });

    return withEvidenceIndex(registry, {
      report: grounded.report,
      reportError: null,
      mode: grounded.groundingSummary.groundedClaims > 0 ? "model_grounded" : "rules_only",
      groundingSummary: grounded.groundingSummary,
      reportDebug: null,
    });
  };
}
