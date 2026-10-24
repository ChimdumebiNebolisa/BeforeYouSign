import { describe, expect, it } from "vitest";

import { evaluateModelClaimSupport } from "@/lib/analysis/ground-model-claims";
import { parseModelLeaseCandidate } from "@/lib/analysis/model-candidate-schema";
import { runOpenAiLeaseClaims } from "@/lib/analysis/openai-report";

const LIVE_FIXTURES = [
  {
    id: "rent",
    quote: "Tenant shall pay monthly rent of $1,450 on the first day of each month.",
    expected: { kind: "money", category: "fees" },
  },
  {
    id: "deposit",
    quote: "Tenant shall pay a refundable security deposit of $900 before move-in.",
    expected: { kind: "money", category: "fees" },
  },
  {
    id: "notice",
    quote: "Tenant must give 30 days written notice before moving out.",
    expected: { kind: "deadline", category: "notice" },
  },
  {
    id: "electricity",
    quote: "Resident is responsible for electric service and must place it in the resident's name.",
    expected: { kind: "concern", category: "utilities" },
  },
  {
    id: "pet-approval",
    quote: "Tenant must obtain the landlord's written consent before keeping an animal.",
    expected: { kind: "concern", category: "pets" },
  },
] as const;

const describeLiveModel = process.env.BYS_LIVE_MODEL_EVAL === "1" ? describe : describe.skip;

describeLiveModel("live model evaluation", () => {
  it("emits no unsupported claims and recalls at least 80% of annotated claims", async () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    expect(apiKey, "OPENAI_API_KEY is required for the opt-in live evaluation").toBeTruthy();

    let expectedClaims = 0;
    let recalledClaims = 0;
    const unsupportedByFixture = new Map<string, number>();
    const unsupportedTypesByFixture = new Map<string, Set<string>>();

    for (let run = 0; run < 3; run += 1) {
      for (const fixture of LIVE_FIXTURES) {
        expectedClaims += 1;
        const evidenceId = `live-${fixture.id}`;
        const result = await runOpenAiLeaseClaims({
          apiKey: apiKey!,
          evidenceCatalog: [{ id: evidenceId, page: 1, text: fixture.quote }],
          ruleBasedFindings: [],
          deterministicRisk: { score: 0, band: "low", reasons: [] },
          texasRenterFindings: [],
        });
        expect(result.ok, `Provider failure for ${fixture.id} run ${run + 1}`).toBe(true);
        if (!result.ok) continue;

        const candidate = parseModelLeaseCandidate(result.rawCandidate);
        expect(candidate, `Invalid candidate for ${fixture.id} run ${run + 1}`).not.toBeNull();
        if (!candidate) continue;

        const accepted = candidate.claims.filter(
          (claim) =>
            claim.evidenceId === evidenceId &&
            evaluateModelClaimSupport(claim, fixture.quote).supported,
        );
        const expectedWasRecalled = accepted.some(
          (claim) =>
            claim.kind === fixture.expected.kind && claim.category === fixture.expected.category,
        );
        if (expectedWasRecalled) recalledClaims += 1;

        const unsupportedClaims = accepted.filter(
          (claim) =>
            claim.kind !== fixture.expected.kind || claim.category !== fixture.expected.category,
        );
        if (unsupportedClaims.length > 0) {
          unsupportedByFixture.set(
            fixture.id,
            (unsupportedByFixture.get(fixture.id) ?? 0) + unsupportedClaims.length,
          );
          const types = unsupportedTypesByFixture.get(fixture.id) ?? new Set<string>();
          unsupportedClaims.forEach((claim) => types.add(`${claim.kind}:${claim.category}`));
          unsupportedTypesByFixture.set(fixture.id, types);
        }
      }
    }

    const recall = recalledClaims / expectedClaims;
    console.info(JSON.stringify({
      fixtureIds: LIVE_FIXTURES.map((fixture) => fixture.id),
      runs: 3,
      unsupportedAcceptedClaims: [...unsupportedByFixture.values()].reduce((sum, count) => sum + count, 0),
      unsupportedTypesByFixture: [...unsupportedTypesByFixture].map(([id, types]) => [id, [...types]]),
      recall,
    }));
    expect([...unsupportedByFixture.entries()]).toEqual([]);
    expect(recall).toBeGreaterThanOrEqual(0.8);
  }, 180_000);
});
