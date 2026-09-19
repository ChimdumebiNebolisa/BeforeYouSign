import type { RuleBasedFindingCategory } from "@/lib/analysis/rules";
import type { DeterministicRiskBand } from "@/lib/analysis/scoring";
import type { TexasRenterTopic } from "@/lib/legal-reference/texas-renter-references";

export type AnnotationSpan = {
  page: number;
  start: number;
  end: number;
  category: RuleBasedFindingCategory;
  text: string;
};

export type FixtureManifestEntry = {
  id: string;
  path: string;
  license: string;
  consent: string;
  redaction: "synthetic" | "public" | "adversarial";
  description: string;
};

export type EvaluationFixture = {
  id: string;
  text: string;
  pages: { page: number; text: string }[];
  annotations: AnnotationSpan[];
  expected: {
    rentAmount?: string;
    depositAmount?: string;
    ruleCategories: RuleBasedFindingCategory[];
    texasTopics: TexasRenterTopic[];
    riskBand?: DeterministicRiskBand;
  };
};

export type EvaluationMetrics = {
  groundingRate: number;
  unsupportedFindingRate: number;
  expectedValueAccuracy: number;
  ruleCategoryPrecision: number;
  ruleCategoryRecall: number;
  texasTopicPrecision: number;
  texasTopicRecall: number;
  annotationSpanRecall: number;
  riskBandAccuracy: number;
  ruleFindings: number;
  texasTopics: number;
};

export type EvaluationRunResult = {
  fixtureId: string;
  mode: "rules_only";
  metrics: EvaluationMetrics;
  errors: string[];
};
