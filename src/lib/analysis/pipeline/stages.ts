export type AnalysisStage =
  | "validating_input"
  | "extracting_text"
  | "normalizing_text"
  | "detecting_clauses"
  | "scoring_risk"
  | "generating_report"
  | "validating_evidence"
  | "completed"
  | "failed";

export const ANALYSIS_STAGE_LABELS: Record<AnalysisStage, string> = {
  validating_input: "Validating input",
  extracting_text: "Extracting lease text",
  normalizing_text: "Normalizing text",
  detecting_clauses: "Checking key terms",
  scoring_risk: "Scoring review priority",
  generating_report: "Generating summary",
  validating_evidence: "Validating evidence",
  completed: "Completed",
  failed: "Failed",
};
