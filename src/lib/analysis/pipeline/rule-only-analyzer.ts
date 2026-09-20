import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import type { AnalysisEngine, AnalysisEngineResult } from "@/lib/analysis/pipeline/types";
import { createEvidenceRegistry, registerSpanEvidence } from "@/lib/evidence/registry";
import { buildEvidenceIndex } from "@/lib/evidence/index";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

function withEvidenceIndex(
  registry: ReturnType<typeof createEvidenceRegistry>,
  result: Omit<AnalysisEngineResult, "evidenceIndex">,
): AnalysisEngineResult {
  return {
    ...result,
    evidenceIndex: buildEvidenceIndex(registry),
  };
}

function registerTexasFindingEvidence(
  registry: ReturnType<typeof createEvidenceRegistry>,
  documentId: string,
  pages: ExtractedTextPage[],
  findings: TexasRenterFinding[],
): TexasRenterFinding[] {
  return findings.map((finding) => {
    const pageText = pages.find((page) => page.page === finding.page)?.text ?? "";
    const startIndex = pageText.indexOf(finding.leaseQuote);
    if (startIndex < 0) {
      const ungrounded = { ...finding };
      delete ungrounded.evidenceId;
      delete ungrounded.startIndex;
      delete ungrounded.endIndex;
      return ungrounded;
    }

    const evidence = registerSpanEvidence(registry, {
      documentId,
      page: finding.page,
      startIndex,
      endIndex: startIndex + finding.leaseQuote.length,
      text: finding.leaseQuote,
    });
    return {
      ...finding,
      evidenceId: evidence.evidenceId,
      startIndex: evidence.startIndex,
      endIndex: evidence.endIndex,
    };
  });
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
    const texasRenterFindings = registerTexasFindingEvidence(
      registry,
      document.documentId,
      document.pages,
      deterministic.texasRenterFindings,
    );

    return withEvidenceIndex(registry, {
      report,
      reportError: null,
      mode: "rules_only",
      texasRenterFindings,
    });
  };
}
