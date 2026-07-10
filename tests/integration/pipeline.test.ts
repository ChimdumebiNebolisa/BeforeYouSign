import { describe, expect, it } from "vitest";

import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { createDefaultModelAnalyzer } from "@/lib/analysis/pipeline/model-analyzer";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { createEvidenceRegistry } from "@/lib/evidence/registry";

const sampleText =
  "Monthly rent is $1,450 due on the first of each month. Security deposit: $1,450. Late fee of $75 applies after grace period.";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("runAnalysisPipeline", () => {
  it("analyzes pasted JSON text end-to-end with fake model", async () => {
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
      expect(response.analysisVersion).toBe(2);
      expect(response.mode).toBe("rules_only");
      expect(response.extractedPages.length).toBe(1);
      expect(response.document.extraction.method).toBe("pasted_text");
    }
  });

  it("rejects oversized pasted text", async () => {
    const { response, httpStatus } = await runAnalysisPipeline({
      request: makeJsonRequest({ leaseText: "x".repeat(120_001) }),
      extractPdfTextPages: async () => [],
      modelAnalyzer: createDefaultModelAnalyzer(),
    });

    expect(httpStatus).toBe(413);
    expect(response.ok).toBe(false);
  });
});
