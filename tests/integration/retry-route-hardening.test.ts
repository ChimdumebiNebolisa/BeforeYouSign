import { describe, expect, it, vi } from "vitest";

import { POST as analyzePost } from "@/app/api/analyze/route";
import { POST as retryPost } from "@/app/api/analyze/retry-model/route";
import { computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";
import { runModelRetryPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { emitSafeAnalysisEvent } from "@/lib/observability/safe-analysis-events";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("retry route hardening", () => {
  it("valid retry payload succeeds without PDF extraction", async () => {
    const sampleText = "Monthly rent is $1,450. Late fee $75.";
    const pages = [{ page: 1, text: sampleText }];
    const documentId = computeContentIntegrityKey(pages);

    const originalModelEnabled = process.env.BYS_MODEL_ENABLED;
    process.env.BYS_MODEL_ENABLED = "0";

    try {
      const response = await retryPost(
        jsonRequest("http://localhost/api/analyze/retry-model", {
          documentId,
          pages,
          fileName: "retry-test.txt",
        }),
      );

      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        ok: boolean;
        stage?: string;
        documentId?: string;
        evidenceIndex?: Record<string, unknown>;
      };
      expect(body.ok).toBe(true);
      expect(body.stage).toBe("completed");
      expect(body.documentId).toBe(documentId);
      expect(body.evidenceIndex && Object.keys(body.evidenceIndex).length).toBeGreaterThan(0);
    } finally {
      if (originalModelEnabled === undefined) delete process.env.BYS_MODEL_ENABLED;
      else process.env.BYS_MODEL_ENABLED = originalModelEnabled;
    }
  });

  it.each([
    ["empty pages", { documentId: "abc", pages: [] }],
    [
      "integrity mismatch",
      {
        documentId: "wrong",
        pages: [{ page: 1, text: "Monthly rent is $1,450." }],
      },
    ],
    [
      "untrusted evidenceIndex",
      {
        documentId: computeContentIntegrityKey([{ page: 1, text: "Rent $100" }]),
        pages: [{ page: 1, text: "Rent $100" }],
        evidenceIndex: { fake: { page: 1 } },
      },
    ],
    [
      "too many pages",
      {
        documentId: "abc",
        pages: Array.from({ length: ANALYSIS_LIMITS.maxPages + 1 }, (_, i) => ({
          page: i + 1,
          text: "Rent clause.",
        })),
      },
    ],
  ])("rejects invalid retry payload: %s", async (_label, payload) => {
    const response = await retryPost(
      jsonRequest("http://localhost/api/analyze/retry-model", payload),
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    const body = (await response.json()) as { ok: boolean; stage?: string };
    expect(body.ok).toBe(false);
    expect(body.stage).toBe("validating_input");
  });

  it("does not log raw lease text on validation failure", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const secretLease = "Super secret landlord clause about $9,999 fee.";

    await retryPost(
      jsonRequest("http://localhost/api/analyze/retry-model", {
        documentId: "mismatch",
        pages: [{ page: 1, text: secretLease }],
      }),
    );

    const logged = logSpy.mock.calls.map((call) => JSON.stringify(call)).join(" ");
    expect(logged).not.toContain(secretLease);
    logSpy.mockRestore();
  });

  it("handles Gemini timeout via model analyzer fallback", async () => {
    const sampleText = "Monthly rent is $1,450.";
    const pages = [{ page: 1, text: sampleText }];
    const documentId = computeContentIntegrityKey(pages);
    const registry = createEvidenceRegistry(documentId, pages);

    const fakeAnalyzer = async () => ({
      report: buildRuleOnlyFallbackReport({
        documentId,
        pages,
        ruleBasedFindings: [],
        deterministicRisk: { score: 1, band: "low", reasons: [] },
        evidenceRegistry: registry,
      }),
      reportError: null,
      mode: "rules_only" as const,
      reportDebug: { failureStage: "network" },
      evidenceIndex: undefined,
    });

    const { response, httpStatus } = await runModelRetryPipeline({
      request: new Request("http://localhost/api/analyze/retry-model", { method: "POST" }),
      retry: {
        documentId,
        pages,
        fileName: "t.txt",
        fileSizeBytes: sampleText.length,
        contentType: "text/plain",
        extraction: {
          method: "pasted_text",
          pageCount: 1,
          totalChars: sampleText.length,
          quality: 1,
          coverageStatus: "complete",
        },
      },
      modelAnalyzer: fakeAnalyzer,
    });

    expect(httpStatus).toBe(200);
    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.mode).toBe("rules_only");
    }
  });

  it("primary analyze route still rejects oversized pasted text", async () => {
    const response = await analyzePost(
      jsonRequest("http://localhost/api/analyze", { leaseText: "x".repeat(120_001) }),
    );
    expect(response.status).toBe(413);
  });

  it("safe analysis events redact lease-like strings", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubEnv("NODE_ENV", "development");

    emitSafeAnalysisEvent({
      requestId: "req-redact",
      stage: "validating_input",
      failureCode: "invalid_input",
    });

    emitSafeAnalysisEvent({
      requestId: "req-redact-2",
      stage: "failed",
      mode: "Monthly rent is $1,450",
    });

    const logged = logSpy.mock.calls.map((call) => String(call[1] ?? "")).join(" ");
    expect(logged).not.toContain("$1,450");

    vi.unstubAllEnvs();
    logSpy.mockRestore();
  });
});
