import { describe, expect, it } from "vitest";

import { buildReportMarkdown } from "@/lib/report-export";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";

const minimalReport: BeforeYouSignReport = {
  summary: "Sample lease with rent and deposit terms.",
  whatYoureAgreeingTo: ["Pay monthly rent"],
  riskLevel: "medium",
  riskReason: "Late fee language may increase cost.",
  moneyAndFees: [
    {
      label: "Monthly rent",
      value: "$1,450",
      evidence: [{ page: 1, quote: "Monthly rent is $1,450", evidenceId: "ev-test-1", supportStatus: "grounded" }],
    },
  ],
  deadlinesAndNotice: [],
  responsibilities: ["Replace HVAC filters"],
  potentialRedFlags: [],
  questionsToAsk: ["When is rent due?"],
  nextSteps: ["Review payment method"],
  missingOrUnclear: [],
  disclaimer: "Educational information only. Not legal advice.",
};

describe("buildReportMarkdown", () => {
  it("includes disclaimer, mode, and summary sections", () => {
    const md = buildReportMarkdown({
      report: minimalReport,
      texasRenterFindings: [],
      fileName: "sample-lease.txt",
      mode: "model_grounded",
      deterministicRiskBand: "medium",
      deterministicRiskReasons: ["Late fee detected"],
    });

    expect(md).toContain("Educational information only");
    expect(md).toContain("AI-enhanced");
    expect(md).toContain("## Summary");
    expect(md).toContain("sample-lease.txt");
    expect(md).toContain("ev-test-1");
    expect(md).toContain("Late fee detected");
  });

  it("labels rule-based mode correctly", () => {
    const md = buildReportMarkdown({
      report: minimalReport,
      texasRenterFindings: [],
      mode: "rules_only",
    });
    expect(md).toContain("Rule-based only");
  });
});
