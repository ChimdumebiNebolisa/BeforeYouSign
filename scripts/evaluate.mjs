#!/usr/bin/env node
/**
 * Deterministic evaluation harness (no external model calls).
 * Run: npm run evaluate
 */

import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vitest", "run", "tests/integration/evaluation.test.ts"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
