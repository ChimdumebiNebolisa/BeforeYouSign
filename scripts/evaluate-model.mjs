#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(
  "npx",
  ["vitest", "run", "tests/integration/live-model-evaluation.test.ts"],
  {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, BYS_LIVE_MODEL_EVAL: "1" },
  },
);

process.exit(result.status ?? 1);
