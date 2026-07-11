import { describe, expect, it } from "vitest";

import { isClickableGroundedEvidence } from "@/lib/analysis/evidence-click";
import type { EvidenceRef } from "@/lib/analysis/schema";

describe("isClickableGroundedEvidence", () => {
  it.each<[string, EvidenceRef | undefined, boolean]>([
    ["undefined evidence", undefined, false],
    [
      "legacy id",
      { page: 1, quote: "x", evidenceId: "legacy-1-0", supportStatus: "unknown" },
      false,
    ],
    [
      "grounded without offsets",
      { page: 1, quote: "x", evidenceId: "ev-abc", supportStatus: "grounded" },
      false,
    ],
    [
      "fully grounded",
      {
        page: 1,
        quote: "Monthly rent",
        evidenceId: "ev-abc",
        startIndex: 0,
        endIndex: 12,
        supportStatus: "grounded",
      },
      true,
    ],
  ])("%s", (_label, ev, expected) => {
    expect(isClickableGroundedEvidence(ev)).toBe(expected);
  });
});
