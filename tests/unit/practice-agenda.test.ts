import { describe, expect, it } from "vitest";
import { buildAgendaFromReport } from "@/lib/practice/agenda";
import { samplePractice } from "@/lib/practice/sample";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";

const report: BeforeYouSignReport = {
  summary: "A fictional lease with fees and utilities to clarify.",
  whatYoureAgreeingTo: ["Rent and listed responsibilities"],
  riskLevel: "medium",
  riskReason: "Several terms need confirmation.",
  moneyAndFees: [{ label: "Administrative fee", value: "$300", evidence: [{ page: 1, quote: "$300 administrative fee" }] }],
  deadlinesAndNotice: [{ label: "Renewal notice", value: "60 days", evidence: [{ page: 2, quote: "Sixty days written notice" }] }],
  responsibilities: ["Utilities"],
  potentialRedFlags: [{ id: "utility-1", category: "utilities", title: "Water", severity: "moderate", explanation: "Water term", whyItMatters: "It affects monthly cost.", evidence: [{ page: 1, quote: "Water is included in the monthly rent." }] }],
  questionsToAsk: ["What is the administrative fee and is any part refundable?", "How many days of written notice are required?", "Is water included in the listed rent or billed separately?"],
  nextSteps: ["Ask for written clarification."],
  missingOrUnclear: ["Refundability is not identified."],
  disclaimer: "Informational only.",
};

describe("practice agenda and sample", () => {
  it("hands report questions into an editable, evidence-linked practice agenda", () => {
    const agenda = buildAgendaFromReport({ report, document: { documentId: "doc-1", fileName: "lease.txt", revision: "analysis-1", extractionLimitations: [] } });
    expect(agenda.items).toHaveLength(3);
    expect(agenda.items[0].category).toBe("fees");
    expect(agenda.items[0].sourceRefs[0].quote).toContain("$300");
    expect(agenda.items.find((item) => item.category === "utilities")?.sourceRefs[0].page).toBe(1);
  });

  it("keeps the sample explicitly fictional and review-oriented", () => {
    const sample = samplePractice();
    expect(sample.agenda.origin).toBe("synthetic_example");
    expect(sample.review.origin).toBe("practice_roleplay");
    expect(sample.review.items.some((item) => item.gap === "follow-up needed")).toBe(true);
  });
});
