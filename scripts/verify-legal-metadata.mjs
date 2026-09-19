#!/usr/bin/env node
/**
 * Verifies Texas legal reference metadata (not legal interpretation).
 * Run: npm run verify:legal-metadata
 */

import { readFileSync } from "node:fs";
import path from "node:path";

const referencesPath = path.join(
  process.cwd(),
  "src/lib/legal-reference/texas-renter-references.ts",
);
const source = readFileSync(referencesPath, "utf8");

let failed = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failed += 1;
}

function pass(msg) {
  console.log(`PASS: ${msg}`);
}

const idMatches = [...source.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const uniqueIds = new Set(idMatches);
if (uniqueIds.size !== idMatches.length) {
  fail("Duplicate legal reference IDs detected");
} else {
  pass(`Unique IDs (${uniqueIds.size})`);
}

if (!/landlordEntry[\s\S]*?sourceUrl:\s*"https:\/\/sll\.texas\.gov\/faqs\/landlord-entry\/"/.test(source)) {
  fail("landlordEntry must point to Texas State Law Library landlord entry FAQ");
} else {
  pass("landlordEntry source citation corrected");
}

if (/landlordEntry[\s\S]*?#92\.008(?!1)/.test(source)) {
  fail("landlordEntry still points to §92.008 (interruption of utilities)");
}

const requiredFields = [
  "jurisdiction",
  "reviewedAt",
  "effectiveThrough",
  "sourceUrl",
  "sourceTitle",
  "sourceType",
  "sourceSectionLabel",
];
for (const field of requiredFields) {
  const count = [...source.matchAll(new RegExp(`\\b${field}:\\s*(?:"|null)`, "g"))].length;
  if (count !== idMatches.length) {
    fail(`Every legal reference must define ${field} (${count}/${idMatches.length})`);
  }
}

const sourceUrls = [...source.matchAll(/sourceUrl:\s*"([^"]+)"/g)].map((m) => m[1]);
if (
  sourceUrls.length !== idMatches.length ||
  sourceUrls.some((value) => {
    try {
      const url = new URL(value);
      return url.protocol !== "https:" || !url.hostname;
    } catch {
      return true;
    }
  })
) {
  fail("Every legal reference must define a valid HTTPS sourceUrl");
} else {
  pass(`Valid source URLs (${sourceUrls.length})`);
}

const reviewedDates = [...source.matchAll(/reviewedAt:\s*"([^"]+)"/g)].map((m) => m[1]);
if (reviewedDates.length !== idMatches.length || reviewedDates.some((value) => Number.isNaN(Date.parse(value)))) {
  fail("Every legal reference must have a parseable reviewedAt date");
} else {
  pass(`Parseable review dates (${reviewedDates.length})`);
}

const effectiveThroughValues = [...source.matchAll(/effectiveThrough:\s*(null|"([^"]+)")/g)].map((m) =>
  m[1] === "null" ? null : m[2],
);
if (
  effectiveThroughValues.length !== idMatches.length ||
  effectiveThroughValues.some((value) => value !== null && Number.isNaN(Date.parse(value)))
) {
  fail("Every legal reference must have null or a parseable effectiveThrough date");
} else {
  pass(`Valid effective-through metadata (${effectiveThroughValues.length})`);
}

const publicCopy = readFileSync(path.join(process.cwd(), "src/lib/public-copy.ts"), "utf8");
if (!/Educational information only\. Not legal advice\./.test(publicCopy)) {
  fail("Public copy must retain the legal disclaimer");
} else {
  pass("Legal disclaimer present in public copy");
}

if (failed === 0) {
  pass("Legal reference metadata checks passed");
  process.exit(0);
} else {
  console.error(`\n${failed} verification failure(s)`);
  process.exit(1);
}
