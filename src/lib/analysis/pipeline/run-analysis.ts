import { analyzeDocument } from "@/lib/analysis/pipeline/analyze-document";
import { assembleSuccessResponse } from "@/lib/analysis/pipeline/assemble-response";
import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { createDefaultModelAnalyzer } from "@/lib/analysis/pipeline/model-analyzer";
import { shouldUseModelContribution } from "@/lib/rollout/flags";
import type {
  AnalysisResponse,
  ModelAnalyzer,
  PdfExtractor,
} from "@/lib/analysis/pipeline/types";
import {
  acquireClientSlot,
  createRequestId,
  getClientKey,
  parseAnalysisInput,
  releaseClientSlot,
} from "@/lib/analysis/pipeline/validate-intake";
import { emitSafeAnalysisEvent } from "@/lib/observability/safe-analysis-events";

export async function runAnalysisPipeline(input: {
  request: Request;
  extractPdfTextPages: PdfExtractor;
  modelAnalyzer?: ModelAnalyzer;
}): Promise<{ response: AnalysisResponse; httpStatus: number }> {
  const requestId = createRequestId();
  const clientKey = getClientKey(input.request);
  const startedAt = Date.now();
  let modelAnalyzer: ModelAnalyzer = input.modelAnalyzer ?? createDefaultModelAnalyzer();

  if (!shouldUseModelContribution() && !input.modelAnalyzer) {
    modelAnalyzer = async ({ document, deterministic }) => {
      const { createEvidenceRegistry } = await import("@/lib/evidence/registry");
      const { buildRuleOnlyFallbackReport } = await import("@/lib/analysis/fallback-report");
      const registry = createEvidenceRegistry(document.documentId, document.pages);
      return {
        report: buildRuleOnlyFallbackReport({
          documentId: document.documentId,
          ruleBasedFindings: deterministic.ruleBasedFindings,
          deterministicRisk: deterministic.deterministicRisk,
          evidenceRegistry: registry,
        }),
        reportError: null,
        mode: "rules_only",
        reportDebug: null,
      };
    };
  }

  const slotProblem = acquireClientSlot(clientKey);
  if (slotProblem) {
    return {
      httpStatus: slotProblem.httpStatus,
      response: {
        ok: false,
        requestId,
        error: {
          code: slotProblem.code,
          message: slotProblem.message,
        },
      },
    };
  }

  try {
    const parsed = await parseAnalysisInput(input.request);
    if (!parsed.ok) {
      emitSafeAnalysisEvent({
        requestId,
        stage: "intake",
        failureCode: parsed.problem.code,
        durationMs: Date.now() - startedAt,
      });
      return {
        httpStatus: parsed.problem.httpStatus,
        response: {
          ok: false,
          requestId,
          error: {
            code: parsed.problem.code,
            message: parsed.problem.message,
            ...(parsed.problem.limit !== undefined ? { limit: parsed.problem.limit } : {}),
            ...(parsed.problem.actual !== undefined ? { actual: parsed.problem.actual } : {}),
          },
        },
      };
    }

    const documentResult = await analyzeDocument(parsed.input, input.extractPdfTextPages);
    if (!documentResult.ok) {
      emitSafeAnalysisEvent({
        requestId,
        stage: "extract",
        failureCode: documentResult.problem.code,
        durationMs: Date.now() - startedAt,
      });
      return {
        httpStatus: documentResult.problem.httpStatus,
        response: {
          ok: false,
          requestId,
          error: {
            code: documentResult.problem.code,
            message: documentResult.problem.message,
            ...(documentResult.problem.limit !== undefined
              ? { limit: documentResult.problem.limit }
              : {}),
            ...(documentResult.problem.actual !== undefined
              ? { actual: documentResult.problem.actual }
              : {}),
          },
        },
      };
    }

    const deterministic = runDeterministicAnalysis(documentResult.document.pages);
    const model = await modelAnalyzer({
      document: documentResult.document,
      deterministic,
    });

    emitSafeAnalysisEvent({
      requestId,
      stage: "complete",
      mode: model.mode,
      pageCount: documentResult.document.pages.length,
      totalChars: documentResult.document.extraction.totalChars,
      droppedClaims: model.groundingSummary?.droppedClaims,
      groundedClaims: model.groundingSummary?.groundedClaims,
      durationMs: Date.now() - startedAt,
    });

    return {
      httpStatus: 200,
      response: assembleSuccessResponse({
        requestId,
        fileName: parsed.input.kind === "text" ? parsed.input.fileName : parsed.input.fileName,
        fileSizeBytes: parsed.fileSizeBytes,
        contentType: documentResult.contentType,
        document: documentResult.document,
        deterministic,
        model,
      }),
    };
  } catch {
    emitSafeAnalysisEvent({
      requestId,
      stage: "analysis_failed",
      failureCode: "analysis_failed",
      durationMs: Date.now() - startedAt,
    });
    return {
      httpStatus: 500,
      response: {
        ok: false,
        requestId,
        error: "We hit an unexpected server error while processing this request. Please retry.",
      },
    };
  } finally {
    releaseClientSlot(clientKey);
  }
}
