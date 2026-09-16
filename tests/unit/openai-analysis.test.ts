import { afterEach, describe, expect, it, vi } from "vitest";

import { runStructuredOpenAiLeaseAnalysis } from "@/lib/analysis/openai-report";
import { createDefaultModelAnalyzer } from "@/lib/analysis/pipeline/model-analyzer";
import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { createEvidenceRegistry } from "@/lib/evidence/registry";

const leaseText = "Monthly rent is $1,450. The security deposit is $1,450.";

function candidate(evidenceId: string) {
  return {
    summary: "The lease states the monthly rent and security deposit clearly.",
    whatYoureAgreeingTo: ["Pay monthly rent and a security deposit."],
    riskLevel: "low",
    riskReason: "The reviewed money terms are stated in the lease.",
    moneyAndFees: [{ label: "Monthly rent", value: "$1,450", evidenceIds: [evidenceId] }],
    deadlinesAndNotice: [],
    responsibilities: [],
    potentialRedFlags: [],
    questionsToAsk: [],
    nextSteps: [],
    missingOrUnclear: [],
    disclaimer: "Educational information only. Not legal advice.",
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("OpenAI Luna lease analysis", () => {
  it("sends a structured Responses request and parses output_text", async () => {
    const responseJson = JSON.stringify(candidate("evidence-1"));
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ output_text: responseJson }), { status: 200 }),
    );

    const result = await runStructuredOpenAiLeaseAnalysis({
      apiKey: "test-openai-key",
      leaseText,
      ruleBasedFindings: [],
      deterministicRisk: { score: 0, band: "low", reasons: [] },
      evidenceCatalog: [{ id: "evidence-1", page: 1, text: leaseText }],
    });

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.any(Object));
    const request = fetchSpy.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.model).toBe("gpt-5.6-luna");
    expect(body.text.format).toMatchObject({ type: "json_schema", name: "lease_report", strict: true });
    expect(body.store).toBe(false);
  });

  it("returns a safe failure for a provider error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("upstream failure", { status: 500 }));

    const result = await runStructuredOpenAiLeaseAnalysis({
      apiKey: "test-openai-key",
      leaseText,
      ruleBasedFindings: [],
      deterministicRisk: { score: 0, band: "low", reasons: [] },
    });

    expect(result).toMatchObject({ ok: false, failureStage: "network" });
  });

  it("uses Luna as the default main analyzer when an OpenAI key is configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("BYS_ANALYSIS_PROVIDER", "openai");
    const pages = [{ page: 1, text: leaseText }];
    const documentId = "openai-analyzer-test";
    const evidenceId = createEvidenceRegistry(documentId, pages).chunks[0]!.id;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ output_text: JSON.stringify(candidate(evidenceId)) }), { status: 200 }),
    );

    const analyzer = createDefaultModelAnalyzer();
    const result = await analyzer({
      document: {
        documentId,
        pages,
        extraction: { method: "pasted_text", pageCount: 1, totalChars: leaseText.length, quality: 1, coverageStatus: "complete" },
      },
      deterministic: runDeterministicAnalysis(pages),
    });

    expect(result.mode).toBe("model_grounded");
    expect(result.groundingSummary?.groundedClaims).toBe(1);
  });
});
