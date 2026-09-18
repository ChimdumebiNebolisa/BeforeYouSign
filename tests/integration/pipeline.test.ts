import { describe, expect, it } from "vitest";

import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { createRuleOnlyAnalyzer } from "@/lib/analysis/pipeline/rule-only-analyzer";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

const sampleText =
  "Monthly rent is $1,450 due on the first of each month. Security deposit: $1,450. Late fee of $75 applies after grace period.";

function makeJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stateCode: "TX", ...((body ?? {}) as Record<string, unknown>) }),
  });
}

function makePdfRequest(): Request {
  const formData = new FormData();
  formData.append("stateCode", "TX");
  formData.append("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "lease.pdf", {
    type: "application/pdf",
  }));
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    body: formData,
  });
}

describe("runAnalysisPipeline", () => {
  it("analyzes pasted JSON text end-to-end with a rule-only analyzer", async () => {
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
      expect(response.analysisVersion).toBe(2);
      expect(response.stage).toBe("completed");
      expect(response.documentId).toBeTruthy();
      expect(response.mode).toBe("rules_only");
      expect(response.stateCode).toBe("TX");
      expect(response.stateGuidance).toBe("supported");
      expect(response.extractedPages.length).toBe(1);
      expect(response.document.extraction.method).toBe("pasted_text");
      expect("recoveryToken" in response).toBe(false);
      expect("jobId" in response).toBe(false);
    }
  });

  it("rejects oversized pasted text", async () => {
    const { response, httpStatus } = await runAnalysisPipeline({
      request: makeJsonRequest({ leaseText: "x".repeat(120_001) }),
      extractPdfTextPages: async () => [],
      analyzer: createRuleOnlyAnalyzer(),
    });

    expect(httpStatus).toBe(413);
    expect(response.ok).toBe(false);
  });

  it("requires a rental property state before analysis", async () => {
    const { response, httpStatus } = await runAnalysisPipeline({
      request: new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseText: sampleText }),
      }),
      extractPdfTextPages: async () => [],
      analyzer: createRuleOnlyAnalyzer(),
    });

    expect(httpStatus).toBe(400);
    expect(response).toMatchObject({
      ok: false,
      error: { code: "invalid_input" },
    });
  });

  it("does not attach Texas references when another state is selected", async () => {
    const { response, httpStatus } = await runAnalysisPipeline({
      request: makeJsonRequest({ leaseText: sampleText, stateCode: "CA" }),
      extractPdfTextPages: async () => [],
      analyzer: createRuleOnlyAnalyzer(),
    });

    expect(httpStatus).toBe(200);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.stateCode).toBe("CA");
      expect(response.stateGuidance).toBe("general_only");
      expect(response.texasRenterFindings).toEqual([]);
    }
  });

  it("rejects PDFs over the page limit before report assembly", async () => {
    const { response, httpStatus } = await runAnalysisPipeline({
      request: makePdfRequest(),
      extractPdfTextPages: async () =>
        Array.from({ length: ANALYSIS_LIMITS.maxPages + 1 }, (_, index) => ({
          page: index + 1,
          text: "Monthly rent is $1,200.",
        })),
      analyzer: createRuleOnlyAnalyzer(),
    });

    expect(httpStatus).toBe(413);
    expect(response).toMatchObject({
      ok: false,
      error: { code: "too_many_pages", actual: ANALYSIS_LIMITS.maxPages + 1 },
    });
  });
});
