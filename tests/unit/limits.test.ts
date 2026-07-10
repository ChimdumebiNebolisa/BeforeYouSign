import { describe, expect, it } from "vitest";

import { ANALYSIS_LIMITS, createAnalysisProblem } from "@/lib/analysis/limits";

describe("ANALYSIS_LIMITS", () => {
  it("defines expected upload bounds", () => {
    expect(ANALYSIS_LIMITS.maxPdfBytes).toBe(10 * 1024 * 1024);
    expect(ANALYSIS_LIMITS.maxPages).toBe(100);
    expect(ANALYSIS_LIMITS.maxChars).toBe(120_000);
    expect(ANALYSIS_LIMITS.maxConcurrentPerClient).toBe(1);
  });

  it("maps problem codes to HTTP statuses", () => {
    expect(createAnalysisProblem("payload_too_large", "too big").httpStatus).toBe(413);
    expect(createAnalysisProblem("rate_limited", "slow down").httpStatus).toBe(429);
    expect(createAnalysisProblem("extraction_empty", "empty").httpStatus).toBe(422);
    expect(createAnalysisProblem("invalid_input", "bad").httpStatus).toBe(400);
  });
});
