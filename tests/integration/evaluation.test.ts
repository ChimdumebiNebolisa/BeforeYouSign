import { writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { runDeterministicEvaluation } from "@/lib/evaluation/run";

describe("deterministic evaluation harness", () => {
  it("runs synthetic fixtures and meets grounding gate", () => {
    const fixturesDir = path.join(process.cwd(), "evaluation/fixtures");
    const results = runDeterministicEvaluation(fixturesDir);
    expect(results.length).toBeGreaterThan(0);

    for (const result of results) {
      expect(result.metrics.groundingRate).toBeGreaterThanOrEqual(1);
      expect(result.metrics.unsupportedFindingRate).toBe(0);
    }

    const baselinePath = path.join(process.cwd(), "evaluation/baselines/deterministic-v1.json");
    writeFileSync(
      baselinePath,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          fixtureCount: results.length,
          avgGroundingRate:
            results.reduce((sum, r) => sum + r.metrics.groundingRate, 0) / results.length,
          results,
        },
        null,
        2,
      )}\n`,
    );
  });
});
