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

  it("extracts a slash-date non-renewal deadline", () => {
    const pages = [
      {
        page: 1,
        text: "To avoid automatic renewal, Tenant must deliver written notice by 03/01/2027.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.noticeSnippets).toHaveLength(1);
    expect(report.deadlinesAndNotice).toContainEqual(
      expect.objectContaining({
        label: "Notice requirement",
        value: "03/01/2027",
      }),
    );
  });

  it("extracts a written-notice deadline stated in hours", () => {
    const pages = [
      {
        page: 1,
        text: "Tenant must give written notice within 24 hours after discovering water damage.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.noticeSnippets).toHaveLength(1);
    expect(report.deadlinesAndNotice).toContainEqual(
      expect.objectContaining({
        label: "Notice requirement",
        value: "24 hours",
      }),
    );
  });

  it("extracts a written-notice deadline stated in business days", () => {
    const pages = [
      {
        page: 1,
        text: "Tenant must provide written notice within five (5) business days after receiving a lease violation notice.",
      },
    ];
    const analysis = runDeterministicAnalysis(pages);
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: analysis.ruleBasedFindings,
      deterministicRisk: analysis.deterministicRisk,
    });

    expect(analysis.noticeSnippets).toHaveLength(1);
    expect(report.deadlinesAndNotice).toContainEqual(
      expect.objectContaining({
        label: "Notice requirement",
        value: "five (5) business days",
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

  it("preserves both parts of a lesser-of late charge", () => {
    const pages = [
      {
        page: 1,
        text: "Late charge: the lesser of $75 or 5% of the monthly rent will be charged if rent is more than five days late.",
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
        value: "lesser of $75 or 5% of the monthly rent",
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

  it("preserves fixed and daily components of a late fee", () => {
    const pages = [
      {
        page: 1,
        text: "Late fee: Tenant must pay $50 plus $10 per day until the unpaid rent is paid in full.",
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
        value: "$50 plus $10 per day",
      }),
    );
  });

  it("preserves the monthly cadence of a percentage late charge", () => {
    const pages = [
      {
        page: 1,
        text: "Late charge: Tenant must pay 5% of unpaid rent per month until the balance is paid in full.",
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
        value: "5% of unpaid rent per month",
      }),
    );
  });

  it("extracts a percentage-based payment convenience fee", () => {
    const pages = [
      {
        page: 1,
        text: "A 3% convenience fee will be charged for rent payments made by credit card.",
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
        label: "Payment convenience fee",
        value: "3%",
      }),
    );
  });

  it("extracts a returned-payment fee stated as insufficient funds", () => {
    const pages = [
      {
        page: 1,
        text: "A $35 fee will be charged for each payment returned due to insufficient funds.",
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
        label: "Returned payment fee",
        value: "$35",
      }),
    );
  });

  it("extracts annual interest on past-due rent", () => {
    const pages = [
      {
        page: 1,
        text: "Past-due rent accrues interest at 18% per annum until paid.",
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
        label: "Past-due interest",
        value: "18% per annum",
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

  it("extracts percentage-based holdover rent", () => {
    const pages = [
      {
        page: 1,
        text: "Holdover rent: Tenant shall pay 150% of the monthly rent for each month Tenant remains after the lease term ends.",
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
        label: "Holdover rent",
        value: "150% of the monthly rent",
      }),
    );
  });

  it("preserves the daily rate for dollar-based holdover rent", () => {
    const pages = [
      {
        page: 1,
        text: "Holdover rent: Tenant shall pay $75 per day for every day Tenant remains after the lease term ends.",
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
        label: "Holdover rent",
        value: "$75 per day",
      }),
    );
  });

  it("keeps severity local to the finding instead of inheriting the report band", () => {
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      ruleBasedFindings: [
        { category: "deposit", page: 1, quote: "Security deposit is $1,500." },
        { category: "renewal", page: 1, quote: "The lease renews automatically unless notice is given." },
      ],
      deterministicRisk: { score: 7, band: "high", reasons: ["Several unrelated terms need review."] },
    });

    expect(
      report.potentialRedFlags.find((finding) => finding.title === "Security deposit needs review")?.severity,
    ).toBe("minor");
    expect(report.potentialRedFlags.find((finding) => finding.category === "renewal")?.severity).toBe("moderate");
  });

  it("marks locally aggressive late fees as critical", () => {
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      ruleBasedFindings: [
        { category: "fees", page: 1, quote: "A late fee equal to 10% of past-due rent applies after five days." },
      ],
      deterministicRisk: { score: 2, band: "medium", reasons: [] },
    });

    expect(report.potentialRedFlags[0]?.severity).toBe("critical");
  });

  it("keeps clearly assigned utilities minor and orders equal severities by document position", () => {
    const pages = [
      {
        page: 1,
        text: "All utilities are paid by Tenant. Tenant handles routine filter replacement.",
      },
    ];
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages,
      ruleBasedFindings: [
        { category: "maintenance", page: 1, quote: "Tenant handles routine filter replacement." },
        { category: "utilities", page: 1, quote: "All utilities are paid by Tenant." },
      ],
      deterministicRisk: { score: 7, band: "high", reasons: [] },
    });

    expect(report.potentialRedFlags.map((finding) => finding.category)).toEqual([
      "utilities",
      "maintenance",
    ]);
    expect(report.potentialRedFlags.map((finding) => finding.severity)).toEqual(["minor", "minor"]);
  });

  it("does not relabel a maintenance clause as a guest finding because guests are mentioned incidentally", () => {
    const quote =
      "Tenant must keep the unit clean and report problems promptly. Tenant is responsible for minor repairs when damage is caused by Tenant, a guest, or a pet. Landlord is responsible for major structural repairs.";
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      pages: [{ page: 1, text: quote }],
      ruleBasedFindings: [{ category: "maintenance", page: 1, quote }],
      deterministicRisk: { score: 2, band: "medium", reasons: [] },
    });

    expect(report.potentialRedFlags[0]).toMatchObject({
      category: "maintenance",
      title: "Maintenance responsibility may need clarification",
    });
  });

  it("diversifies red flags before filling remaining slots", () => {
    const report = buildRuleOnlyFallbackReport({
      documentId: "test-document",
      ruleBasedFindings: [
        { category: "fees", page: 1, quote: "Application fee is $25." },
        { category: "fees", page: 1, quote: "Processing fee is $30." },
        { category: "fees", page: 1, quote: "Parking fee is $50 per month." },
        { category: "fees", page: 1, quote: "Pet fee is $200." },
        { category: "fees", page: 1, quote: "Cleaning fee is $150." },
        { category: "renewal", page: 2, quote: "The lease automatically renews unless notice is given." },
        { category: "notice", page: 2, quote: "Tenant must provide 60 days written notice." },
        { category: "utilities", page: 3, quote: "Utilities may be allocated by management." },
      ],
      deterministicRisk: { score: 5, band: "high", reasons: [] },
    });

    expect(report.potentialRedFlags).toHaveLength(4);
    expect(new Set(report.potentialRedFlags.map((finding) => finding.category)).size).toBeGreaterThan(1);
    expect(report.potentialRedFlags.map((finding) => finding.category)).toEqual(
      expect.arrayContaining(["fees", "renewal", "notice", "utilities"]),
    );
  });
});
