import { describe, expect, it } from "vitest";

import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";

describe("buildRuleOnlyFallbackReport", () => {
  it("extracts a parenthetical move-out notice deadline", () => {
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      ruleBasedFindings: [
        {
          category: "notice",
          page: 1,
          quote: "Tenant shall provide at least sixty (60) days prior written notice of intent to vacate.",
        },
      ],
      deterministicRisk: { score: 1, band: "low", reasons: [] },
    });

    expect(report.deadlinesAndNotice).toContainEqual(
      expect.objectContaining({
        label: "Move-out notice",
        value: "sixty (60) days",
      }),
    );
  });

  it("extracts a fixed-date non-renewal deadline", () => {
    const pages = [
      {
        page: 1,
        text: "To avoid automatic renewal, Tenant must deliver written notice no later than March 1, 2027.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(report.deadlinesAndNotice).toContainEqual(
      expect.objectContaining({
        label: "Notice requirement",
        value: "March 1, 2027",
      }),
    );
  });

  it("preserves both parts of a greater-of late charge", () => {
    const pages = [
      {
        page: 1,
        text: "Late charge: the greater of $75 or 5% of the monthly rent will be charged if rent is more than five days late.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.feeSnippets).toHaveLength(1);
    expect(report.moneyAndFees).toContainEqual(
      expect.objectContaining({
        label: "Late fee",
        value: "greater of $75 or 5% of the monthly rent",
      }),
    );
  });

  it("extracts a percentage-only late fee", () => {
    const pages = [
      {
        page: 1,
        text: "A late fee equal to 5% of the past-due rent will be assessed if payment is not received by the fifth day of the month.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.feeSnippets).toHaveLength(1);
    expect(report.moneyAndFees).toContainEqual(
      expect.objectContaining({
        label: "Late fee",
        value: "5% of the past-due rent",
      }),
    );
  });

  it("extracts liquidated damages set as months of rent for early termination", () => {
    const pages = [
      {
        page: 1,
        text: "Early termination requires Tenant to pay liquidated damages equal to two months' rent.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.feeSnippets).toHaveLength(1);
    expect(analysis.deterministicRisk.reasons).toContain("Ending the lease early may trigger extra charges.");
    expect(report.moneyAndFees).toContainEqual(
      expect.objectContaining({
        label: "Early termination fee",
        value: "two months' rent",
      }),
    );
  });
});
