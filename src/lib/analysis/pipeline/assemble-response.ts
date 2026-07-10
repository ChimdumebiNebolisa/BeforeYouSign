import type {
  AnalysisSuccessResponse,
  DeterministicAnalysis,
  ModelAnalyzerResult,
  NormalizedDocument,
} from "@/lib/analysis/pipeline/types";

export function assembleSuccessResponse(input: {
  requestId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string | null;
  document: NormalizedDocument;
  deterministic: DeterministicAnalysis;
  model: ModelAnalyzerResult;
}): AnalysisSuccessResponse {
  return {
    ok: true,
    analysisVersion: 2,
    mode: input.model.mode,
    requestId: input.requestId,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes,
    contentType: input.contentType,
    document: {
      extraction: input.document.extraction,
    },
    extractedPages: input.document.pages,
    rentSnippets: input.deterministic.rentSnippets,
    depositSnippets: input.deterministic.depositSnippets,
    feeSnippets: input.deterministic.feeSnippets,
    noticeSnippets: input.deterministic.noticeSnippets,
    renewalSnippets: input.deterministic.renewalSnippets,
    maintenanceSnippets: input.deterministic.maintenanceSnippets,
    utilitiesSnippets: input.deterministic.utilitiesSnippets,
    ruleBasedFindings: input.deterministic.ruleBasedFindings,
    unclearLeasePhrases: input.deterministic.unclearLeasePhrases,
    texasRenterFindings: input.deterministic.texasRenterFindings,
    deterministicRiskScore: input.deterministic.deterministicRisk.score,
    deterministicRiskBand: input.deterministic.deterministicRisk.band,
    deterministicRiskReasons: input.deterministic.deterministicRisk.reasons,
    report: input.model.report,
    reportError: input.model.reportError,
    groundingSummary: input.model.groundingSummary,
    reportDebug: input.model.reportDebug,
  };
}
