export type AnnotationSpan = {
  page: number;
  start: number;
  end: number;
  category: string;
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
  annotations?: AnnotationSpan[];
  expected?: {
    rentAmount?: string;
    depositAmount?: string;
    topics?: string[];
  };
};

export type EvaluationRunResult = {
  fixtureId: string;
  mode: "rules_only" | "model_grounded" | "unavailable";
  metrics: Record<string, number>;
  errors: string[];
};
