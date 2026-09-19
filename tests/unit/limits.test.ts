import { describe, expect, it } from "vitest";

import { ANALYSIS_LIMITS, createAnalysisProblem } from "@/lib/analysis/limits";
import { acquireClientSlot, releaseClientSlot } from "@/lib/analysis/pipeline/validate-intake";

describe("ANALYSIS_LIMITS", () => {
  it("defines expected upload bounds", () => {
    expect(ANALYSIS_LIMITS.maxPdfBytes).toBe(4 * 1024 * 1024);
    expect(ANALYSIS_LIMITS.maxMultipartRequestBytes).toBe(4 * 1024 * 1024 + 256 * 1024);
    expect(ANALYSIS_LIMITS.maxPages).toBe(100);
    expect(ANALYSIS_LIMITS.maxChars).toBe(120_000);
    expect(ANALYSIS_LIMITS.maxConcurrentAnalyses).toBe(4);
    expect(ANALYSIS_LIMITS.maxConcurrentPerClient).toBe(1);
  });

  it("maps problem codes to HTTP statuses", () => {
    expect(createAnalysisProblem("payload_too_large", "too big").httpStatus).toBe(413);
    expect(createAnalysisProblem("rate_limited", "slow down").httpStatus).toBe(429);
    expect(createAnalysisProblem("rate_limited", "slow down").retryAfterSeconds).toBe(2);
    expect(createAnalysisProblem("extraction_empty", "empty").httpStatus).toBe(422);
    expect(createAnalysisProblem("invalid_input", "bad").httpStatus).toBe(400);
  });

  it("allows multiple anonymous analyses while enforcing the global cap", () => {
    const acquired = Array.from({ length: ANALYSIS_LIMITS.maxConcurrentAnalyses }, () =>
      acquireClientSlot("anonymous"),
    );

    expect(acquired.every((problem) => problem === null)).toBe(true);
    expect(acquireClientSlot("anonymous")).toMatchObject({ code: "rate_limited" });

    for (let index = 0; index < ANALYSIS_LIMITS.maxConcurrentAnalyses; index += 1) {
      releaseClientSlot("anonymous");
    }
  });
});
