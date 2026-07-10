import { describe, expect, it } from "vitest";

import { emitSafeAnalysisEvent, redactForLogs } from "@/lib/observability/safe-analysis-events";

describe("safe analysis events", () => {
  it("redacts lease-like content from log strings", () => {
    expect(redactForLogs("Monthly rent is $1,450 due on the 1st")).toBe("[redacted]");
    expect(redactForLogs("request completed", 20)).toBe("request completed");
  });

  it("does not throw when emitting events", () => {
    expect(() =>
      emitSafeAnalysisEvent({
        requestId: "req-1",
        stage: "complete",
        pageCount: 3,
        totalChars: 1200,
        durationMs: 42,
      }),
    ).not.toThrow();
  });
});
