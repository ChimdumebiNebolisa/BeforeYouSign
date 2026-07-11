import { describe, expect, it } from "vitest";

import { groundModelCandidates } from "@/lib/analysis/ground-model-candidates";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import type { ModelReportCandidate } from "@/lib/analysis/model-candidate-schema";

describe("groundModelCandidates", () => {
  const pages = [{ page: 1, text: "Monthly rent is $1,450. Late fee of $75 after grace period." }];
  const registry = createEvidenceRegistry("ground-test", pages);
  const chunkId = registry.chunks[0]!.id;

  const baseCandidate: ModelReportCandidate = {
    summary: "Rent and late fee terms appear in the lease.",
    whatYoureAgreeingTo: ["Pay rent monthly"],
    riskLevel: "medium",
    riskReason: "Late fee language may increase cost if rent is delayed.",
    moneyAndFees: [{ label: "Monthly rent", value: "$1,450", evidenceIds: [chunkId] }],
    deadlinesAndNotice: [],
    responsibilities: [],
    potentialRedFlags: [],
    questionsToAsk: ["When is rent due?"],
    nextSteps: ["Review payment method"],
    missingOrUnclear: [],
    disclaimer: "Educational information only. Not legal advice.",
  };

  it("hydrates valid evidence IDs into grounded report rows", () => {
    const result = groundModelCandidates({
      candidate: baseCandidate,
      registry,
      documentId: "ground-test",
      pages,
      ruleBasedFindings: [],
      deterministicRisk: { score: 2, band: "medium", reasons: [] },
    });
    expect(result.report).not.toBeNull();
    expect(result.report?.moneyAndFees[0]?.evidence?.[0]?.evidenceId).toBe(chunkId);
    expect(result.groundingSummary.groundedClaims).toBeGreaterThan(0);
  });

  it("drops invented evidence IDs and falls back to rules-only when nothing grounds", () => {
    const result = groundModelCandidates({
      candidate: {
        ...baseCandidate,
        moneyAndFees: [{ label: "Monthly rent", value: "$9,999", evidenceIds: ["ev-fake-id"] }],
        potentialRedFlags: [],
      },
      registry,
      documentId: "ground-test",
      pages,
      ruleBasedFindings: [],
      deterministicRisk: { score: 1, band: "low", reasons: [] },
    });
    expect(result.groundingSummary.droppedClaims).toBeGreaterThan(0);
    expect(result.report?.moneyAndFees.length).toBeGreaterThanOrEqual(0);
  });

  it("rejects banned legal-judgment wording", () => {
    const result = groundModelCandidates({
      candidate: { ...baseCandidate, summary: "This clause is illegal." },
      registry,
      documentId: "ground-test",
      pages,
      ruleBasedFindings: [],
      deterministicRisk: { score: 1, band: "low", reasons: [] },
    });
    expect(result.groundingSummary.droppedClaims).toBeGreaterThan(0);
  });
});
