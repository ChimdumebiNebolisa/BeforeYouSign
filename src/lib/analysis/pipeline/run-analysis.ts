import { analyzeDocument } from "@/lib/analysis/pipeline/analyze-document";
import { assembleSuccessResponse } from "@/lib/analysis/pipeline/assemble-response";
import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { createRuleOnlyAnalyzer } from "@/lib/analysis/pipeline/rule-only-analyzer";
import type {
  AnalysisEngine,
  AnalysisResponse,
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
  analyzer?: AnalysisEngine;
}): Promise<{ response: AnalysisResponse; httpStatus: number }> {
  const requestId = createRequestId();
  const clientKey = getClientKey(input.request);
  const startedAt = Date.now();
  const analyzer: AnalysisEngine = input.analyzer ?? createRuleOnlyAnalyzer();

  const slotProblem = acquireClientSlot(clientKey);
  if (slotProblem) {
    return {
      httpStatus: slotProblem.httpStatus,
      response: {
        ok: false,
        requestId,
        stage: "validating_input",
        error: {
          code: slotProblem.code,
          message: slotProblem.message,
          ...(slotProblem.retryAfterSeconds !== undefined
            ? { retryAfterSeconds: slotProblem.retryAfterSeconds }
            : {}),
        },
      },
    };
  }

  try {
    const parsed = await parseAnalysisInput(input.request);
    if (!parsed.ok) {
      emitSafeAnalysisEvent({
        requestId,
        stage: "validating_input",
        failureCode: parsed.problem.code,
        durationMs: Date.now() - startedAt,
      });
      return {
        httpStatus: parsed.problem.httpStatus,
        response: {
          ok: false,
          requestId,
          stage: "validating_input",
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
        stage: "extracting_text",
        failureCode: documentResult.problem.code,
        durationMs: Date.now() - startedAt,
      });
      return {
        httpStatus: documentResult.problem.httpStatus,
        response: {
          ok: false,
          requestId,
          stage: "extracting_text",
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

    const deterministic = runDeterministicAnalysis(
      documentResult.document.pages,
      parsed.input.stateCode,
    );

    const engine = await analyzer({
      document: documentResult.document,
      deterministic,
    });

    emitSafeAnalysisEvent({
      requestId,
      stage: "completed",
      mode: engine.mode,
      pageCount: documentResult.document.pages.length,
      totalChars: documentResult.document.extraction.totalChars,
      durationMs: Date.now() - startedAt,
    });

    return {
      httpStatus: 200,
      response: assembleSuccessResponse({
        requestId,
        fileName: parsed.input.fileName,
        fileSizeBytes: parsed.fileSizeBytes,
        contentType: documentResult.contentType,
        stateCode: parsed.input.stateCode,
        document: documentResult.document,
        deterministic,
        engine,
      }),
    };
  } catch {
    emitSafeAnalysisEvent({
      requestId,
      stage: "failed",
      failureCode: "analysis_failed",
      durationMs: Date.now() - startedAt,
    });
    return {
      httpStatus: 500,
      response: {
        ok: false,
        requestId,
        stage: "failed",
        error: "We hit an unexpected server error while processing this request. Please retry.",
      },
    };
  } finally {
    releaseClientSlot(clientKey);
  }
}
