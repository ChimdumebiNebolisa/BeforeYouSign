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
});
