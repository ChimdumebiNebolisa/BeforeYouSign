import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  evaluateModelClaimSupport,
  type ModelClaimRejectionReason,
} from "@/lib/analysis/ground-model-claims";
import type { ModelLeaseClaim } from "@/lib/analysis/model-candidate-schema";

type CandidateFixture = {
  id: string;
  quote: string;
  expectedSupported: boolean;
  claim: ModelLeaseClaim;
};

describe("model candidate grounding evaluation", () => {
  it("accepts supported paraphrases and rejects every adversarial candidate", () => {
    const fixturePath = path.join(
      process.cwd(),
      "evaluation/fixtures/model-candidates.json",
    );
    const fixtures = JSON.parse(readFileSync(fixturePath, "utf8")) as CandidateFixture[];
    const failures: Array<{
      id: string;
      expectedSupported: boolean;
      actualSupported: boolean;
      reasons: ModelClaimRejectionReason[];
    }> = [];

    for (const fixture of fixtures) {
      const result = evaluateModelClaimSupport(fixture.claim, fixture.quote);
      if (result.supported !== fixture.expectedSupported) {
        failures.push({
          id: fixture.id,
          expectedSupported: fixture.expectedSupported,
          actualSupported: result.supported,
          reasons: result.reasons,
        });
      }
    }

    expect(failures).toEqual([]);
  });
});
