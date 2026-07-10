import { describe, expect, it } from "vitest";

import { classifyLeaseMoneyLabel, normalizeReportForCredibility } from "@/lib/analysis/report-normalization";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";

describe("classifyLeaseMoneyLabel", () => {
  it("classifies monthly rent", () => {
    expect(classifyLeaseMoneyLabel("Monthly rent is $1,200")).toBe("Monthly rent");
  });

  it("classifies security deposit", () => {
    expect(classifyLeaseMoneyLabel("Security deposit of $1,200")).toBe("Security deposit");
  });

  it("classifies late fee", () => {
    expect(classifyLeaseMoneyLabel("Late fee of $75")).toBe("Late fee");
  });

  it("returns null for unrecognized text", () => {
    expect(classifyLeaseMoneyLabel("Random clause text")).toBeNull();
  });
});

describe("normalizeReportForCredibility", () => {
  const baseReport: BeforeYouSignReport = {
    summary: "Summary.",
    whatYoureAgreeingTo: [],
    riskLevel: "low",
    riskReason: "Few issues.",
    moneyAndFees: [
      { label: "fee", value: "$50", evidence: [{ page: 1, quote: "Late fee of $50" }] },
    ],
    deadlinesAndNotice: [
      {
        label: "Notice",
        value: "Review notice clause",
        evidence: [{ page: 1, quote: "60 days written notice before moving out" }],
      },
      {
        label: "Other notice",
        value: "Review notice clause",
        evidence: [{ page: 1, quote: "60 days written notice before moving out" }],
      },
    ],
    responsibilities: [],
    potentialRedFlags: [],
    questionsToAsk: [],
    nextSteps: [],
    missingOrUnclear: [],
    disclaimer: "Educational information only. Not legal advice.",
  };

  it("reclassifies generic money labels", () => {
    const normalized = normalizeReportForCredibility(baseReport);
    expect(normalized.moneyAndFees[0]?.label).toBe("Late fee");
  });

  it("dedupes deadline rows with same day window", () => {
    const normalized = normalizeReportForCredibility(baseReport);
    expect(normalized.deadlinesAndNotice.length).toBe(1);
    expect(normalized.deadlinesAndNotice[0]?.value).toMatch(/60 days/i);
  });

  it("normalizes deadline labels", () => {
    const report: BeforeYouSignReport = {
      ...baseReport,
      deadlinesAndNotice: [
        {
          label: "Renewal",
          value: "month-to-month",
          evidence: [{ page: 1, quote: "month-to-month renewal" }],
        },
      ],
    };
    const normalized = normalizeReportForCredibility(report);
    expect(normalized.deadlinesAndNotice[0]?.label).toBe("Renewal notice");
  });
});
