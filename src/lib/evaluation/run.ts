import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import type { EvaluationFixture, EvaluationRunResult } from "@/lib/evaluation/types";
import { groundingRate, unsupportedFindingRate } from "@/lib/evaluation/metrics";

function loadFixture(filePath: string): EvaluationFixture {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as EvaluationFixture;
  if (!raw.id || !raw.pages?.length) {
    throw new Error(`Invalid fixture: ${filePath}`);
  }
  return raw;
}

export function runDeterministicEvaluation(fixturesDir: string): EvaluationRunResult[] {
  const syntheticDir = path.join(fixturesDir, "synthetic");
  const files = readdirSync(syntheticDir).filter((f) => f.endsWith(".json") && f !== "manifest.json");

  return files.map((file) => {
    const fixture = loadFixture(path.join(syntheticDir, file));
    const deterministic = runDeterministicAnalysis(fixture.pages);
    const documentId = hashDocumentId(fixture.pages.map((p) => p.text).join("\n"));
    const registry = createEvidenceRegistry(documentId, fixture.pages);
    const report = buildRuleOnlyFallbackReport({
      documentId,
      ruleBasedFindings: deterministic.ruleBasedFindings,
      deterministicRisk: deterministic.deterministicRisk,
      evidenceRegistry: registry,
    });

    return {
      fixtureId: fixture.id,
      mode: "rules_only",
      metrics: {
        groundingRate: groundingRate(report),
        unsupportedFindingRate: unsupportedFindingRate(report),
        ruleFindings: deterministic.ruleBasedFindings.length,
        texasTopics: deterministic.texasRenterFindings.length,
      },
      errors: [],
    };
  });
}
