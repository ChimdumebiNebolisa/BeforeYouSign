import { describe, expect, it } from "vitest";

import { parseBeforeYouSignReportJson } from "@/lib/analysis/schema";

const validReport = {
  summary: "Sample summary.",
  whatYoureAgreeingTo: ["Rent: $1,200"],
  riskLevel: "low",
  riskReason: "Few notable terms found.",
  moneyAndFees: [{ label: "Monthly rent", value: "$1,200" }],
  deadlinesAndNotice: [],
  responsibilities: ["Utilities: tenant pays electricity"],
  potentialRedFlags: [
    {
      id: "flag-1",
      category: "fees",
      title: "Late fee",
      severity: "minor",
      explanation: "A late fee applies.",
      whyItMatters: "It may add cost.",
      evidence: [{ page: 1, quote: "Late fee of $50" }],
    },
  ],
  questionsToAsk: ["What fees apply?"],
  nextSteps: ["Review the lease."],
  missingOrUnclear: [],
  disclaimer: "Educational information only. Not legal advice.",
};

describe("parseBeforeYouSignReportJson", () => {
  it("accepts a valid report", () => {
    const parsed = parseBeforeYouSignReportJson(validReport);
    expect(parsed).not.toBeNull();
    expect(parsed?.summary).toBe("Sample summary.");
  });

  it("accepts optional evidence offsets", () => {
    const withOffsets = {
      ...validReport,
      moneyAndFees: [
        {
          label: "Monthly rent",
          value: "$1,200",
          evidence: [{ page: 1, quote: "Rent is $1,200", startIndex: 0, endIndex: 15 }],
        },
      ],
    };
    const parsed = parseBeforeYouSignReportJson(withOffsets);
    expect(parsed?.moneyAndFees[0]?.evidence?.[0]?.startIndex).toBe(0);
  });

  it("rejects missing summary", () => {
    const { summary: _s, ...rest } = validReport;
    expect(parseBeforeYouSignReportJson(rest)).toBeNull();
  });

  it("rejects invalid risk level", () => {
    expect(parseBeforeYouSignReportJson({ ...validReport, riskLevel: "extreme" })).toBeNull();
  });

  it("rejects invalid finding category", () => {
    const bad = {
      ...validReport,
      potentialRedFlags: [{ ...validReport.potentialRedFlags[0], category: "invalid" }],
    };
    expect(parseBeforeYouSignReportJson(bad)).toBeNull();
  });

  it("rejects evidence with page < 1", () => {
    const bad = {
      ...validReport,
      potentialRedFlags: [
        {
          ...validReport.potentialRedFlags[0],
          evidence: [{ page: 0, quote: "test" }],
        },
      ],
    };
    expect(parseBeforeYouSignReportJson(bad)).toBeNull();
  });

  it("rejects evidence with empty quote", () => {
    const bad = {
      ...validReport,
      potentialRedFlags: [
        {
          ...validReport.potentialRedFlags[0],
          evidence: [{ page: 1, quote: "   " }],
        },
      ],
    };
    expect(parseBeforeYouSignReportJson(bad)).toBeNull();
  });

  it("accepts decimal page numbers (characterization: schema does not require integers)", () => {
    const withDecimal = {
      ...validReport,
      potentialRedFlags: [
        {
          ...validReport.potentialRedFlags[0],
          evidence: [{ page: 1.5, quote: "Late fee of $50" }],
        },
      ],
    };
    expect(parseBeforeYouSignReportJson(withDecimal)).not.toBeNull();
  });
});
