import type {
  AnalysisSuccessResponse,
  AnalysisEngineResult,
  DeterministicAnalysis,
  NormalizedDocument,
} from "@/lib/analysis/pipeline/types";
import { getStateGuidanceStatus, type StateCode } from "@/lib/jurisdiction/states";

export function assembleSuccessResponse(input: {
  requestId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string | null;
  stateCode: StateCode;
  document: NormalizedDocument;
  deterministic: DeterministicAnalysis;
  engine: AnalysisEngineResult;
}): AnalysisSuccessResponse {
  return {
    ok: true,
    analysisVersion: 2,
    stage: "completed",
    mode: input.engine.mode,
    requestId: input.requestId,
    stateCode: input.stateCode,
    stateGuidance: getStateGuidanceStatus(input.stateCode),
    documentId: input.document.documentId,
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
    texasRenterFindings: input.engine.texasRenterFindings ?? input.deterministic.texasRenterFindings,
    deterministicRiskScore: input.deterministic.deterministicRisk.score,
    deterministicRiskBand: input.deterministic.deterministicRisk.band,
    deterministicRiskReasons: input.deterministic.deterministicRisk.reasons,
    report: input.engine.report,
    reportError: input.engine.reportError,
    evidenceIndex: input.engine.evidenceIndex,
  };
}
