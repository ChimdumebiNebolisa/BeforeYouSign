import { describe, expect, it } from "vitest";

import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import type { AnalysisStage } from "@/lib/analysis/pipeline/stages";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("analysis stages", () => {
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
    const fakeModel = async () => {
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
        reportDebug: null,
        evidenceIndex: undefined,
      };
    };

    const { response, httpStatus } = await runAnalysisPipeline({
      request: makeJsonRequest({ leaseText: sampleText }),
      extractPdfTextPages: async () => [],
      modelAnalyzer: fakeModel,
    });

    expect(httpStatus).toBe(200);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.stage).toBe("completed");
      expect(response.documentId).toBeTruthy();
    }
  });
});
