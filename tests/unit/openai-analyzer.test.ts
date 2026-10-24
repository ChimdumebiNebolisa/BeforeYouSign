import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { createOpenAiAnalyzer } from "@/lib/analysis/pipeline/openai-analyzer";
import type { NormalizedDocument } from "@/lib/analysis/pipeline/types";

const { runOpenAiLeaseClaims } = vi.hoisted(() => ({ runOpenAiLeaseClaims: vi.fn() }));

vi.mock("@/lib/analysis/openai-report", () => ({ runOpenAiLeaseClaims }));

function document(text: string): NormalizedDocument {
  return {
    documentId: "openai-analyzer-test",
    pages: [{ page: 1, text }],
    extraction: {
      method: "pasted_text",
      pageCount: 1,
      totalChars: text.length,
      quality: 1,
      coverageStatus: "complete",
    },
  };
}

describe("createOpenAiAnalyzer", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("BYS_AI_ENABLED", "1");
    runOpenAiLeaseClaims.mockReset();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("returns the full deterministic report when AI is disabled", async () => {
    vi.stubEnv("BYS_AI_ENABLED", "0");
    const doc = document("Monthly rent is $1,450. This wording appears in the residential rental agreement.");
    const result = await createOpenAiAnalyzer()({
      document: doc,
      deterministic: runDeterministicAnalysis(doc.pages, "TX"),
    });

    expect(result.mode).toBe("rules_only");
    expect(result.report).not.toBeNull();
    expect(runOpenAiLeaseClaims).not.toHaveBeenCalled();
  });

  it("merges a grounded AI claim without changing deterministic risk", async () => {
    const doc = document("Monthly rent is $1,450. This wording appears in the residential rental agreement.");
    const deterministic = runDeterministicAnalysis(doc.pages, "TX");
    runOpenAiLeaseClaims.mockImplementation(async (request) => ({
      ok: true,
      rawCandidate: {
        claims: [
          {
            id: "rent",
            kind: "money",
            category: "fees",
            label: "Monthly rent",
            value: "$1,450",
            severity: "moderate",
            explanation: "Monthly rent is $1,450.",
            whyItMatters: "This is the base monthly housing cost.",
            evidenceId: request.evidenceCatalog[0].id,
          },
        ],
      },
    }));

    const result = await createOpenAiAnalyzer()({ document: doc, deterministic });

    expect(result.mode).toBe("model_grounded");
    expect(result.report?.riskLevel).toBe(deterministic.deterministicRisk.band);
    expect(result.groundingSummary).toEqual({ materialClaims: 1, groundedClaims: 1, droppedClaims: 0 });
  });

  it("falls back on provider failure or an unsupported candidate", async () => {
    const doc = document("Monthly rent is $1,450. This wording appears in the residential rental agreement.");
    const deterministic = runDeterministicAnalysis(doc.pages, "TX");
    runOpenAiLeaseClaims.mockResolvedValueOnce({ ok: false, failureStage: "network" });
    expect((await createOpenAiAnalyzer()({ document: doc, deterministic })).mode).toBe("rules_only");

    runOpenAiLeaseClaims.mockResolvedValueOnce({ ok: true, rawCandidate: { unexpected: [] } });
    expect((await createOpenAiAnalyzer()({ document: doc, deterministic })).mode).toBe("rules_only");
  });
});
