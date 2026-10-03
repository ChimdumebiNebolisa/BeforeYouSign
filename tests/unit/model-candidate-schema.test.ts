import { describe, expect, it } from "vitest";

import { parseModelLeaseCandidate } from "@/lib/analysis/model-candidate-schema";

const validClaim = {
  id: "late-fee",
  kind: "money",
  category: "fees",
  label: "Late fee",
  value: "$75",
  severity: "moderate",
  explanation: "A $75 late fee applies after the grace period.",
  whyItMatters: "This can increase the amount due.",
  evidenceId: "ev-document-1-0",
};

describe("parseModelLeaseCandidate", () => {
  it("accepts the bounded claim schema", () => {
    expect(parseModelLeaseCandidate({ claims: [validClaim] })).toEqual({ claims: [validClaim] });
  });

  it("rejects provider drift and unsupported categories", () => {
    expect(parseModelLeaseCandidate({ findings: [validClaim] })).toBeNull();
    expect(parseModelLeaseCandidate({ claims: [{ ...validClaim, category: "other" }] })).toBeNull();
    expect(parseModelLeaseCandidate({ claims: [{ ...validClaim, surprise: true }] })).toBeNull();
  });

  it("rejects unbounded output", () => {
    expect(parseModelLeaseCandidate({ claims: Array.from({ length: 17 }, () => validClaim) })).toBeNull();
  });
});
