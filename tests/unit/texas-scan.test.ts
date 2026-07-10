import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { scanTexasRenterTopics } from "@/lib/legal-reference/texas-renter-scan";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

const standardLease = normalizeLeasePageText(
  readFileSync(path.join(process.cwd(), "public/sample-leases/standard.txt"), "utf8"),
);

describe("scanTexasRenterTopics", () => {
  it("finds security deposit topic in standard lease", () => {
    const findings = scanTexasRenterTopics([{ page: 1, text: standardLease }]);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.topic === "securityDeposit")).toBe(true);
  });

  it("includes source metadata on findings when context is enabled", () => {
    const findings = scanTexasRenterTopics([{ page: 1, text: standardLease }]);
    const deposit = findings.find((f) => f.topic === "securityDeposit");
    expect(deposit?.contextAvailable).toBe(true);
    expect(deposit?.sourceUrl).toMatch(/^https:\/\//);
    expect(deposit?.sourceTitle?.length).toBeGreaterThan(0);
    expect(deposit?.questionToAsk.length).toBeGreaterThan(0);
  });

  it("uses corrected landlord entry source (State Law Library, not §92.008)", () => {
    const text =
      "Landlord entry: Landlord may enter the unit with reasonable notice, generally at least 24 hours.";
    const findings = scanTexasRenterTopics([{ page: 1, text }]);
    const entry = findings.find((f) => f.topic === "landlordEntry");
    expect(entry).toBeDefined();
    expect(entry?.sourceUrl).toContain("sll.texas.gov/faqs/landlord-entry");
    expect(entry?.sourceSectionLabel).not.toMatch(/interruption of utilities/i);
  });

  it("returns empty for unrelated text", () => {
    expect(scanTexasRenterTopics([{ page: 1, text: "Hello world." }])).toEqual([]);
  });

  it("caps findings per topic at 2", () => {
    const text = [
      "Security deposit: $500 due at signing.",
      "Security deposit may be used for damages.",
      "Deposit refund within 30 days.",
      "Return of deposit after move-out.",
    ].join(" ");
    const findings = scanTexasRenterTopics([{ page: 1, text }]);
    const depositCount = findings.filter((f) => f.topic === "securityDeposit").length;
    expect(depositCount).toBeLessThanOrEqual(2);
  });
});
