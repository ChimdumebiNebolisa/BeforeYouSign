#!/usr/bin/env node
/**
 * Verifies Texas legal reference metadata (not legal interpretation).
 * Run: npm run verify:legal
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

const requiredFields = ["jurisdiction", "reviewedAt", "sourceUrl", "sourceTitle", "sourceSectionLabel"];
for (const field of requiredFields) {
  if (!source.includes(`${field}:`)) {
    fail(`Missing field pattern: ${field}`);
  }
}

if (failed === 0) {
  pass("Legal reference metadata checks passed");
  process.exit(0);
} else {
  console.error(`\n${failed} verification failure(s)`);
  process.exit(1);
}
