import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { createDefaultModelAnalyzer } from "@/lib/analysis/pipeline/model-analyzer";
import type { NormalizedDocument } from "@/lib/analysis/pipeline/types";

const { runStructuredLeaseAnalysis } = vi.hoisted(() => ({
  runStructuredLeaseAnalysis: vi.fn(),
}));

vi.mock("@/lib/analysis/gemini-report", () => ({
  runStructuredLeaseAnalysis,
}));

function makeDocument(text: string): NormalizedDocument {
  const pages = [{ page: 1, text }];
  return {
    documentId: "document-test",
    pages,
    extraction: {
      method: "pasted_text",
      pageCount: 1,
      totalChars: text.length,
      quality: 1,
      coverageStatus: "complete",
    },
  };
}

function modelCandidate(evidenceId: string, riskLevel: "low" | "medium" | "high" = "high") {
  return {
    summary: "The lease sets a monthly payment and deposit amount.",
    whatYoureAgreeingTo: ["Pay the monthly rent on time."],
    riskLevel,
    riskReason: "Review the payment terms and deposit language.",
    moneyAndFees: [{ label: "Rent", value: "$1,450", evidenceIds: [evidenceId] }],
    deadlinesAndNotice: [],
    responsibilities: ["Keep the home in good condition."],
    potentialRedFlags: [],
    questionsToAsk: ["When is rent due?"],
    nextSteps: ["Review the payment terms."],
    missingOrUnclear: [],
    disclaimer: "Educational information only. Not legal advice.",
  };
}

describe("default model analyzer", () => {
  beforeEach(() => {
    vi.stubEnv("BYS_AI_KEY", "test-key");
    vi.stubEnv("BYS_MODEL_ENABLED", "1");
    runStructuredLeaseAnalysis.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a deterministic report when no AI key is configured", async () => {
    vi.stubEnv("BYS_AI_KEY", "");
    const document = makeDocument("Monthly rent is $1,450. Security deposit is $1,450.");
    const deterministic = runDeterministicAnalysis(document.pages);

    const result = await createDefaultModelAnalyzer()({ document, deterministic });

    expect(result.mode).toBe("unavailable");
    expect(result.report).not.toBeNull();
    expect(runStructuredLeaseAnalysis).not.toHaveBeenCalled();
  });

  it("combines grounded AI content while retaining the deterministic risk band", async () => {
    const document = makeDocument("Monthly rent is $1,450. Security deposit is $1,450.");
    const deterministic = runDeterministicAnalysis(document.pages);
    runStructuredLeaseAnalysis.mockImplementation(async (input) => ({
      ok: true,
      rawText: "{}",
      rawParsed: modelCandidate(input.evidenceCatalog?.[0]?.id ?? "", "high"),
    }));

    const result = await createDefaultModelAnalyzer()({ document, deterministic });

    expect(result.mode).toBe("model_grounded");
    expect(result.report).not.toBeNull();
    expect(result.report?.riskLevel).toBe(deterministic.deterministicRisk.band);
    expect(result.groundingSummary?.groundedClaims).toBeGreaterThan(0);
  });

  it("returns the deterministic report when Gemini fails", async () => {
    runStructuredLeaseAnalysis.mockResolvedValue({
      ok: false,
      userMessage: "safe message",
      failureStage: "network",
    });
    const document = makeDocument("Monthly rent is $1,450.");
    const deterministic = runDeterministicAnalysis(document.pages);

    const result = await createDefaultModelAnalyzer()({ document, deterministic });

    expect(result.mode).toBe("rules_only");
    expect(result.report).not.toBeNull();
  });
});
