import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildRuleBasedFindings,
  findDepositSnippets,
  findFeeSnippets,
  findMaintenanceSnippets,
  findNoticeSnippets,
  findRenewalSnippets,
  findRentSnippets,
  findUnclearLeasePhrases,
  findUtilitiesSnippets,
} from "@/lib/analysis/rules";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

const standardLease = normalizeLeasePageText(
  readFileSync(path.join(process.cwd(), "public/sample-leases/standard.txt"), "utf8"),
);
const standardPages = [{ page: 1, text: standardLease }];

describe("findRentSnippets", () => {
  it("finds monthly rent in standard lease", () => {
    const hits = findRentSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /\$1,425/.test(h.quote))).toBe(true);
  });

  it("returns empty for unrelated text", () => {
    expect(findRentSnippets([{ page: 1, text: "No money mentioned here." }])).toEqual([]);
  });
});

describe("findDepositSnippets", () => {
  it("finds security deposit in standard lease", () => {
    const hits = findDepositSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /security deposit/i.test(h.quote))).toBe(true);
  });
});

describe("findFeeSnippets", () => {
  it("finds late fee in standard lease", () => {
    const hits = findFeeSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /late fee/i.test(h.quote))).toBe(true);
  });
});

describe("findNoticeSnippets", () => {
  it("finds notice period in standard lease", () => {
    const hits = findNoticeSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /60 days/i.test(h.quote))).toBe(true);
  });
});

describe("findRenewalSnippets", () => {
  it("finds automatic renewal in standard lease", () => {
    const hits = findRenewalSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /automatic renewal/i.test(h.quote))).toBe(true);
  });
});

describe("findMaintenanceSnippets", () => {
  it("finds maintenance language in standard lease", () => {
    const hits = findMaintenanceSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /maintenance/i.test(h.quote))).toBe(true);
  });
});

describe("findUtilitiesSnippets", () => {
  it("finds utilities language in standard lease", () => {
    const hits = findUtilitiesSnippets(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /utilities/i.test(h.quote))).toBe(true);
  });
});

describe("findUnclearLeasePhrases", () => {
  it("finds open-ended fee language", () => {
    const hits = findUnclearLeasePhrases(standardPages);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /discretion/i.test(h.quote))).toBe(true);
  });

  it("returns empty for clear text", () => {
    expect(findUnclearLeasePhrases([{ page: 1, text: "Rent is $1,200 due on the 1st." }])).toEqual([]);
  });
});

describe("buildRuleBasedFindings", () => {
  it("aggregates all snippet groups", () => {
    const findings = buildRuleBasedFindings({
      rent: findRentSnippets(standardPages),
      deposit: findDepositSnippets(standardPages),
      fees: findFeeSnippets(standardPages),
      notice: findNoticeSnippets(standardPages),
      renewal: findRenewalSnippets(standardPages),
      maintenance: findMaintenanceSnippets(standardPages),
      utilities: findUtilitiesSnippets(standardPages),
    });
    expect(findings.length).toBeGreaterThan(5);
    expect(findings.every((f) => f.page >= 1 && f.quote.length > 0)).toBe(true);
  });
});

describe("deduplication", () => {
  it("characterization: does not dedupe identical page+quote matches at snippet level", () => {
    const text = "Rent is $1,200 per month. Rent is $1,200 per month.";
    const pages = [{ page: 1, text }];
    const hits = findRentSnippets(pages);
    expect(hits.length).toBe(2);
  });
});
