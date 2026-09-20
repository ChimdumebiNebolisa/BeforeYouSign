import { describe, expect, it } from "vitest";

import { isEvidenceRelevantToFindingCategory } from "@/lib/analysis/evidence-relevance";
import type { FindingCategory } from "@/lib/analysis/schema";

describe("isEvidenceRelevantToFindingCategory", () => {
  it.each<[FindingCategory, string]>([
    ["fees", "A late fee of $75 applies after five days."],
    ["renewal", "This lease automatically renews month-to-month."],
    ["notice", "Tenant must give 60 days written notice before moving out."],
    ["maintenance", "Landlord is responsible for major structural repairs."],
    ["utilities", "Tenant pays electricity and water."],
    ["guests", "Guests may stay no more than seven consecutive nights."],
    ["pets", "Pets require written approval and a monthly pet fee."],
    ["subletting", "Subletting and short-term rentals require consent."],
    ["termination", "An early termination fee applies when breaking the lease."],
    ["entry", "Landlord may enter the unit for an inspection."],
  ])("accepts %s evidence with a relevant signal", (category, quote) => {
    expect(isEvidenceRelevantToFindingCategory(category, quote)).toBe(true);
  });

  it("accepts an inflected renewal verb without another renewal keyword", () => {
    expect(
      isEvidenceRelevantToFindingCategory(
        "renewal",
        "The lease automatically renews for another twelve-month term.",
      ),
    ).toBe(true);
  });

  it.each<[FindingCategory, string]>([
    ["guests", "Landlord is responsible for structural repairs."],
    ["pets", "Tenant pays electricity and water."],
    ["maintenance", "Guests may stay for seven nights."],
    ["entry", "A late fee of $75 applies."],
    ["other", "This sentence is present in the lease."],
  ])("rejects %s evidence without a relevant signal", (category, quote) => {
    expect(isEvidenceRelevantToFindingCategory(category, quote)).toBe(false);
  });
});
