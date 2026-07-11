import path from "node:path";
import { defineConfig } from "vitest/config";

const CRITICAL_PATTERN_MODULES = [
  "src/lib/analysis/pipeline/stages.ts",
  "src/lib/analysis/pipeline/content-integrity.ts",
  "src/lib/analysis/pipeline/parse-model-retry.ts",
  "src/lib/analysis/evidence-click.ts",
  "src/lib/evidence/index.ts",
  "src/lib/evidence/segment.ts",
  "src/lib/report-export.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      include: CRITICAL_PATTERN_MODULES,
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
