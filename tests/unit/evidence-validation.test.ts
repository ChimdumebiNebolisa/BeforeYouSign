import { describe, expect, it } from "vitest";

import { buildEvidenceIndex, lookupEvidenceHighlight } from "@/lib/evidence/index";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import { resolveQuoteToChunk } from "@/lib/evidence/segment";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";

describe("evidence validation", () => {
  const leaseText =
    "Monthly rent is $1,450. Late fee of $75 after grace period. Security deposit $1,450.";
  const pages = [{ page: 1, text: leaseText }];
  const documentId = "evidence-validation-test";
  const registry = createEvidenceRegistry(documentId, pages);

  it("builds evidence index from registry chunks", () => {
    const index = buildEvidenceIndex(registry);
    expect(Object.keys(index).length).toBeGreaterThan(0);
    const firstId = registry.chunks[0]!.id;
    expect(index[firstId]?.page).toBe(1);
  });

  it("resolves quotes to chunks for fallback evidence", () => {
    const chunk = resolveQuoteToChunk(registry.chunks, 1, "Late fee of $75");
    expect(chunk).not.toBeNull();
    expect(chunk?.text).toContain("Late fee");
  });

  it("lookupEvidenceHighlight returns offsets by evidenceId", () => {
    const index = buildEvidenceIndex(registry);
    const id = registry.chunks[0]!.id;
    const hit = lookupEvidenceHighlight(index, id);
    expect(hit?.startIndex).toBeGreaterThanOrEqual(0);
    expect(hit?.endIndex).toBeGreaterThan(hit!.startIndex);
  });

  it("fallback report uses stable evidence IDs when registry provided", () => {
    const report = buildRuleOnlyFallbackReport({
      documentId,
      pages,
      ruleBasedFindings: [
        { category: "rent", page: 1, quote: "Monthly rent is $1,450." },
        { category: "fees", page: 1, quote: "Late fee of $75 after grace period." },
      ],
      deterministicRisk: { score: 2, band: "medium", reasons: ["Late fee language"] },
      evidenceRegistry: registry,
    });

    const rentEvidence = report.moneyAndFees.find((row) => row.label === "Monthly rent")?.evidence?.[0];
    expect(rentEvidence?.evidenceId).toBeDefined();
    expect(rentEvidence?.evidenceId).not.toMatch(/^legacy-/);
  });

  it("rejects quote mismatch when quote not in page text", () => {
    const chunk = resolveQuoteToChunk(registry.chunks, 1, "Nonexistent clause about unicorns.");
    expect(chunk).toBeNull();
  });
});
