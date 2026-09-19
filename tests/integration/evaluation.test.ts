import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { evaluateFixture, runDeterministicEvaluation } from "@/lib/evaluation/run";

describe("deterministic evaluation harness", () => {
  it("runs annotated synthetic fixtures and meets every deterministic gate", () => {
    const fixturesDir = path.join(process.cwd(), "evaluation/fixtures");
    const results = runDeterministicEvaluation(fixturesDir);
    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.errors, result.fixtureId).toEqual([]);
      expect(result.metrics.expectedValueAccuracy).toBe(1);
      expect(result.metrics.ruleCategoryPrecision).toBe(1);
      expect(result.metrics.ruleCategoryRecall).toBe(1);
      expect(result.metrics.texasTopicPrecision).toBe(1);
      expect(result.metrics.texasTopicRecall).toBe(1);
      expect(result.metrics.annotationSpanRecall).toBe(1);
      expect(result.metrics.riskBandAccuracy).toBe(1);
      expect(result.metrics.groundingRate).toBe(1);
      expect(result.metrics.unsupportedFindingRate).toBe(0);
    }

    const baselinePath = path.join(process.cwd(), "evaluation/baselines/deterministic-v1.json");
    const baseline = JSON.parse(readFileSync(baselinePath, "utf8")) as {
      fixtureCount: number;
      avgGroundingRate: number;
      results: typeof results;
    };
    const current = {
      fixtureCount: results.length,
      avgGroundingRate:
        results.reduce((sum, r) => sum + r.metrics.groundingRate, 0) / results.length,
      results,
    };
    expect(baseline).toEqual(current);
  });

  it("fails when an expected detector category emits no findings", () => {
    const result = evaluateFixture({
      id: "missing-detector-output",
      text: "No matching lease terms.",
      pages: [{ page: 1, text: "No matching lease terms." }],
      annotations: [],
      expected: {
        ruleCategories: ["fees"],
        texasTopics: [],
      },
    });

    expect(result.metrics.ruleCategoryRecall).toBe(0);
    expect(result.errors).toContain("Missing rule categories: fees");
  });

  it("fails when an unexpected detector category is emitted", () => {
    const result = evaluateFixture({
      id: "unexpected-detector-output",
      text: "Unexpected category fixture.",
      pages: [{ page: 1, text: "Application fee is $25." }],
      annotations: [],
      expected: {
        ruleCategories: [],
        texasTopics: [],
      },
    });

    expect(result.metrics.ruleCategoryPrecision).toBe(0);
    expect(result.errors).toContain("Unexpected rule categories: fees");
  });
});
