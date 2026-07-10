import { describe, expect, it } from "vitest";

import {
  TEXAS_RENTER_SUPPLEMENTAL_SOURCES,
  TEXAS_RENTER_TOPIC_RECORDS,
  isTexasContextEnabled,
} from "@/lib/legal-reference/texas-renter-references";

const APPROVED_SOURCE_TYPES = new Set([
  "official_statute",
  "state_law_library",
  "legal_aid_resource",
  "public_agency_resource",
]);

describe("Texas legal reference provenance", () => {
  const allRecords = [
    ...Object.values(TEXAS_RENTER_TOPIC_RECORDS),
    ...TEXAS_RENTER_SUPPLEMENTAL_SOURCES,
  ];

  it("has unique source IDs", () => {
    const ids = allRecords.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("requires provenance fields on every record", () => {
    for (const record of allRecords) {
      expect(record.jurisdiction).toBe("Texas");
      expect(record.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.sourceUrl).toMatch(/^https:\/\//);
      expect(APPROVED_SOURCE_TYPES.has(record.sourceType)).toBe(true);
      expect(record.sourceTitle.length).toBeGreaterThan(0);
      expect(record.sourceSectionLabel.length).toBeGreaterThan(0);
      expect(typeof record.contextEnabled).toBe("boolean");
    }
  });

  it("does not use §92.008 for landlord entry", () => {
    const entry = TEXAS_RENTER_TOPIC_RECORDS.landlordEntry;
    expect(entry.sourceUrl).not.toContain("#92.008");
    expect(entry.sourceSectionLabel).not.toMatch(/interruption of utilities/i);
    expect(entry.sourceUrl).toContain("sll.texas.gov");
  });

  it("enables context for all active primary topics", () => {
    for (const record of Object.values(TEXAS_RENTER_TOPIC_RECORDS)) {
      expect(isTexasContextEnabled(record)).toBe(true);
    }
  });
});
