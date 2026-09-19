import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { runDeterministicAnalysis } from "@/lib/analysis/pipeline/deterministic";
import { buildRuleOnlyFallbackReport } from "@/lib/analysis/fallback-report";
import { hashDocumentId } from "@/lib/analysis/pipeline/validate-intake";
import { createEvidenceRegistry } from "@/lib/evidence/registry";
import type { EvaluationFixture, EvaluationRunResult } from "@/lib/evaluation/types";
import {
  annotationSpanRecall,
  compareExpectedSets,
  expectedValueAccuracy,
  groundingRate,
  unmatchedAnnotations,
  unsupportedFindingRate,
} from "@/lib/evaluation/metrics";

function loadFixture(filePath: string): EvaluationFixture {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as EvaluationFixture;
  if (
    !raw.id ||
    !raw.pages?.length ||
    !Array.isArray(raw.annotations) ||
    !raw.expected ||
    !Array.isArray(raw.expected.ruleCategories) ||
    !Array.isArray(raw.expected.texasTopics)
  ) {
    throw new Error(`Invalid fixture: ${filePath}`);
  }
  return raw;
}

export function evaluateFixture(fixture: EvaluationFixture): EvaluationRunResult {
  const deterministic = runDeterministicAnalysis(fixture.pages, "TX");
  const documentId = hashDocumentId(fixture.pages.map((p) => p.text).join("\n"));
  const registry = createEvidenceRegistry(documentId, fixture.pages);
  const report = buildRuleOnlyFallbackReport({
    documentId,
    pages: fixture.pages,
    ruleBasedFindings: deterministic.ruleBasedFindings,
    deterministicRisk: deterministic.deterministicRisk,
    evidenceRegistry: registry,
  });
  const actualRuleCategories = [...new Set(deterministic.ruleBasedFindings.map((finding) => finding.category))];
  const actualTexasTopics = [...new Set(deterministic.texasRenterFindings.map((finding) => finding.topic))];
  const ruleComparison = compareExpectedSets(fixture.expected.ruleCategories, actualRuleCategories);
  const topicComparison = compareExpectedSets(fixture.expected.texasTopics, actualTexasTopics);
  const valueAccuracy = expectedValueAccuracy(report, fixture.expected);
  const spanRecall = annotationSpanRecall(
    fixture.annotations,
    deterministic.ruleBasedFindings,
    fixture.pages,
  );
  const errors: string[] = [];

  if (ruleComparison.missing.length) errors.push(`Missing rule categories: ${ruleComparison.missing.join(", ")}`);
  if (ruleComparison.unexpected.length) errors.push(`Unexpected rule categories: ${ruleComparison.unexpected.join(", ")}`);
  if (topicComparison.missing.length) errors.push(`Missing Texas topics: ${topicComparison.missing.join(", ")}`);
  if (topicComparison.unexpected.length) errors.push(`Unexpected Texas topics: ${topicComparison.unexpected.join(", ")}`);
  if (valueAccuracy < 1) errors.push("Expected rent or deposit value was not extracted accurately.");
  if (fixture.expected.riskBand && fixture.expected.riskBand !== deterministic.deterministicRisk.band) {
    errors.push(`Expected risk band ${fixture.expected.riskBand}, received ${deterministic.deterministicRisk.band}.`);
  }
  for (const annotation of unmatchedAnnotations(
    fixture.annotations,
    deterministic.ruleBasedFindings,
    fixture.pages,
  )) {
    errors.push(`Unmatched annotation: ${annotation.category} page ${annotation.page} [${annotation.start}, ${annotation.end}).`);
  }

  return {
    fixtureId: fixture.id,
    mode: "rules_only",
    metrics: {
      groundingRate: groundingRate(report),
      unsupportedFindingRate: unsupportedFindingRate(report),
      expectedValueAccuracy: valueAccuracy,
      ruleCategoryPrecision: ruleComparison.precision,
      ruleCategoryRecall: ruleComparison.recall,
      texasTopicPrecision: topicComparison.precision,
      texasTopicRecall: topicComparison.recall,
      annotationSpanRecall: spanRecall,
      riskBandAccuracy:
        !fixture.expected.riskBand || fixture.expected.riskBand === deterministic.deterministicRisk.band ? 1 : 0,
      ruleFindings: deterministic.ruleBasedFindings.length,
      texasTopics: deterministic.texasRenterFindings.length,
    },
    errors,
  };
}

export function runDeterministicEvaluation(fixturesDir: string): EvaluationRunResult[] {
  const syntheticDir = path.join(fixturesDir, "synthetic");
  const files = readdirSync(syntheticDir)
    .filter((f) => f.endsWith(".json") && f !== "manifest.json")
    .sort();

  return files.map((file) => evaluateFixture(loadFixture(path.join(syntheticDir, file))));
}
