import { describe, expect, it } from "vitest";

import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { validateExtractedPageLimits } from "@/lib/analysis/pipeline/analyze-document";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import type { AnalysisStage } from "@/lib/analysis/pipeline/stages";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stateCode: "TX", ...((body ?? {}) as Record<string, unknown>) }),
  });
}

describe("analysis stages", () => {
  it("enforces extracted page limits for any extraction source", () => {
    expect(
      validateExtractedPageLimits(
        Array.from({ length: ANALYSIS_LIMITS.maxPages + 1 }, (_, index) => ({
          page: index + 1,
          text: "Lease text",
        })),
      ),
    ).toMatchObject({ code: "too_many_pages", actual: ANALYSIS_LIMITS.maxPages + 1 });

    expect(
      validateExtractedPageLimits([{ page: 1, text: "x".repeat(ANALYSIS_LIMITS.maxChars + 1) }]),
    ).toMatchObject({ code: "too_many_chars", actual: ANALYSIS_LIMITS.maxChars + 1 });
  });

  it("returns validating_input stage for invalid JSON body", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });

    const { response, httpStatus } = await runAnalysisPipeline({
      request,
      extractPdfTextPages: async () => [],
    });

    expect(httpStatus).toBe(400);
    expect(response.ok).toBe(false);
    if (!response.ok) {
      expect(response.stage).toBe("validating_input" satisfies AnalysisStage);
    }
  });

  it("returns completed stage on success", async () => {
    const sampleText = "Monthly rent is $1,450 due on the first.";
    const fakeAnalyzer = async () => {
      const documentId = hashDocumentId(sampleText);
      const registry = createEvidenceRegistry(documentId, [{ page: 1, text: sampleText }]);
      return {
        report: buildRuleOnlyFallbackReport({
          documentId,
          ruleBasedFindings: [],
          deterministicRisk: { score: 1, band: "low", reasons: [] },
          evidenceRegistry: registry,
        }),
        reportError: null,
        mode: "rules_only" as const,
        evidenceIndex: undefined,
      };
    };

    const { response, httpStatus } = await runAnalysisPipeline({
      request: makeJsonRequest({ leaseText: sampleText }),
      extractPdfTextPages: async () => [],
      analyzer: fakeAnalyzer,
    });

    expect(httpStatus).toBe(200);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.stage).toBe("completed");
      expect(response.documentId).toBeTruthy();
    }
  });
});
