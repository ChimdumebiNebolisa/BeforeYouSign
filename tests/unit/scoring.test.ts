import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildRuleBasedFindings, findFeeSnippets, findRenewalSnippets, findUnclearLeasePhrases } from "@/lib/analysis/rules";
import { computeDeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

const feeHeavy = normalizeLeasePageText(
  readFileSync(path.join(process.cwd(), "public/sample-leases/fee-heavy.txt"), "utf8"),
);
const standard = normalizeLeasePageText(
  readFileSync(path.join(process.cwd(), "public/sample-leases/standard.txt"), "utf8"),
);

describe("computeDeterministicLeaseRisk", () => {
  it("returns low band for minimal lease text", () => {
    const risk = computeDeterministicLeaseRisk({
      fullText: "Rent is $1,200 per month.",
      findings: [],
      unclearPhrases: [],
    });
    expect(risk.band).toBe("low");
    expect(risk.score).toBeLessThanOrEqual(1);
  });

  it("returns medium or high for fee-heavy lease", () => {
    const fees = findFeeSnippets([{ page: 1, text: feeHeavy }]);
    const findings = buildRuleBasedFindings({
      rent: [],
      deposit: [],
      fees,
      notice: [],
      renewal: [],
      maintenance: [],
      utilities: [],
    });
    const unclear = findUnclearLeasePhrases([{ page: 1, text: feeHeavy }]);
    const risk = computeDeterministicLeaseRisk({
      fullText: feeHeavy,
      findings,
      unclearPhrases: unclear,
    });
    expect(["medium", "high"]).toContain(risk.band);
    expect(risk.reasons.length).toBeGreaterThan(0);
  });

  it("flags automatic renewal in standard lease", () => {
    const renewal = findRenewalSnippets([{ page: 1, text: standard }]);
    const findings = buildRuleBasedFindings({
      rent: [],
      deposit: [],
      fees: [],
      notice: [],
      renewal,
      maintenance: [],
      utilities: [],
    });
    const risk = computeDeterministicLeaseRisk({
      fullText: standard,
      findings,
      unclearPhrases: findUnclearLeasePhrases([{ page: 1, text: standard }]),
    });
    expect(risk.reasons.some((r) => /renew/i.test(r))).toBe(true);
  });

  it("flags auto-renewal wording in the renewal risk score", () => {
    const text = "This Lease will auto-renew for successive one-year terms unless either party gives written notice of non-renewal.";
    const renewal = findRenewalSnippets([{ page: 1, text }]);
    const findings = buildRuleBasedFindings({
      rent: [],
      deposit: [],
      fees: [],
      notice: [],
      renewal,
      maintenance: [],
      utilities: [],
    });
    const risk = computeDeterministicLeaseRisk({
      fullText: text,
      findings,
      unclearPhrases: [],
    });

    expect(risk.reasons).toContain("This lease may renew automatically unless notice is given.");
  });

  it("flags broad landlord access without notice", () => {
    const risk = computeDeterministicLeaseRisk({
      fullText: "Landlord may access the Premises at any reasonable time without prior notice.",
      findings: [],
      unclearPhrases: [],
    });

    expect(risk.reasons).toContain("Landlord entry language may be broad.");
  });

  it("does not combine an unrelated percentage with late or rent language", () => {
    const risk = computeDeterministicLeaseRisk({
      fullText: "Renter's insurance receives a 20% discount. Rent is due monthly. Late correspondence is logged.",
      findings: [],
      unclearPhrases: [],
    });

    expect(risk.reasons).not.toContain("Late-fee terms may add costs quickly if rent is late.");
    expect(risk.band).toBe("low");
  });

  it.each([
    "A late fee equal to 10% of past-due rent applies after five days.",
    "A late fee of $25 per day applies until rent is paid.",
  ])("scores an aggressive late fee within one clause: %s", (quote) => {
    const risk = computeDeterministicLeaseRisk({
      fullText: quote,
      findings: [{ category: "fees", page: 1, quote }],
      unclearPhrases: [],
    });

    expect(risk.reasons).toContain("Late-fee terms may add costs quickly if rent is late.");
    expect(risk.band).toBe("medium");
  });

  it("evaluates utility ambiguity within each utility finding", () => {
    const vague = computeDeterministicLeaseRisk({
      fullText: "Utilities may be allocated by management. Elsewhere, the landlord pays pool water costs.",
      findings: [{ category: "utilities", page: 1, quote: "Utilities may be allocated by management." }],
      unclearPhrases: [],
    });
    const assigned = computeDeterministicLeaseRisk({
      fullText: "All utilities are paid by Tenant.",
      findings: [{ category: "utilities", page: 1, quote: "All utilities are paid by Tenant." }],
      unclearPhrases: [],
    });
    const reimbursed = computeDeterministicLeaseRisk({
      fullText: "Utilities: Tenant shall reimburse Landlord for all water and sewer charges.",
      findings: [
        {
          category: "utilities",
          page: 1,
          quote: "Utilities: Tenant shall reimburse Landlord for all water and sewer charges.",
        },
      ],
      unclearPhrases: [],
    });

    expect(vague.reasons).toContain("Utility responsibilities are not clearly split.");
    expect(assigned.reasons).not.toContain("Utility responsibilities are not clearly split.");
    expect(reimbursed.reasons).not.toContain("Utility responsibilities are not clearly split.");
  });
});
