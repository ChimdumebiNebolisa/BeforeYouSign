import { describe, expect, it } from "vitest";

import { buildReportMarkdown } from "@/lib/report-export";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

function texasFinding(overrides: Partial<TexasRenterFinding> & Pick<TexasRenterFinding, "id" | "topic">): TexasRenterFinding {
  return {
    topicLabel: "Topic",
    page: 1,
    leaseQuote: "Sample lease language.",
    explanation: "Educational context only.",
    questionToAsk: "What does this clause mean?",
    contextAvailable: true,
    ...overrides,
  };
}

const minimalReport: BeforeYouSignReport = {
  summary: "Sample lease with rent and deposit terms.",
  whatYoureAgreeingTo: ["Pay monthly rent"],
  riskLevel: "medium",
  riskReason: "Late fee language may increase cost.",
      moneyAndFees: [
        {
          label: "Monthly rent",
          value: "$1,450",
          evidence: [
            {
              page: 1,
              quote: "Monthly rent is $1,450",
              evidenceId: "ev-test-1",
              startIndex: 0,
              endIndex: 22,
              supportStatus: "grounded",
            },
          ],
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

  it("includes Texas renter findings and omits empty evidence from export", () => {
    const md = buildReportMarkdown({
      report: {
        ...minimalReport,
        moneyAndFees: [
          {
            label: "Fee",
            value: "$10",
            evidence: [{ page: 1, quote: "ungrounded", supportStatus: "unknown" }],
          },
        ],
      },
      texasRenterFindings: [
        texasFinding({
          id: "tx-1",
          topic: "securityDeposit",
          topicLabel: "Security deposits",
          questionToAsk: "Is the deposit refundable?",
          page: 2,
          leaseQuote: "Deposit shall be returned within 30 days.",
          sourceUrl: "https://example.com",
          sourceTitle: "Example source",
        }),
      ],
    });
    expect(md).toContain("Security deposits");
    expect(md).toContain("Example source");
    expect(md).not.toContain("ungrounded");
  });

  it("exports optional sections, grounded evidence, and empty placeholders", () => {
    const md = buildReportMarkdown({
      report: {
        ...minimalReport,
        deadlinesAndNotice: [
          {
            label: "Notice period",
            value: "30 days",
            evidence: [
              {
                page: 1,
                quote: "Thirty days written notice required",
                evidenceId: "ev-deadline",
                startIndex: 0,
                endIndex: 33,
                supportStatus: "grounded",
              },
            ],
          },
        ],
        potentialRedFlags: [
          {
            id: "flag-renewal",
            category: "renewal",
            title: "Automatic renewal",
            severity: "moderate",
            explanation: "Lease renews unless you opt out.",
            whyItMatters: "You may stay longer than planned.",
            evidence: [
              {
                page: 1,
                quote: "Lease automatically renews",
                evidenceId: "ev-flag",
                startIndex: 0,
                endIndex: 24,
                supportStatus: "grounded",
              },
            ],
          },
        ],
        missingOrUnclear: [],
      },
      texasRenterFindings: [
        texasFinding({
          id: "tx-2",
          topic: "repairs",
          topicLabel: "Repairs",
          questionToAsk: "Who handles emergency repairs?",
          leaseQuote: "Landlord shall maintain premises.",
          sourceUrl: "https://example.org/texas",
        }),
      ],
      mode: "unavailable",
    });

    expect(md).toContain("AI unavailable");
    expect(md).toContain("ev-deadline");
    expect(md).toContain("Automatic renewal");
    expect(md).toContain("Why it matters:");
    expect(md).toContain("https://example.org/texas");
    expect(md).toContain("None listed in this report.");
    expect(md).not.toContain("undefined");
  });

  it("lists missing or unclear items when present", () => {
    const md = buildReportMarkdown({
      report: {
        ...minimalReport,
        missingOrUnclear: ["Pet policy not specified"],
      },
      texasRenterFindings: [],
    });
    expect(md).toContain("Pet policy not specified");
  });
});
