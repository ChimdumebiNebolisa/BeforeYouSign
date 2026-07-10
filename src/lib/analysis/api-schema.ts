import type { AnalysisResponse } from "@/lib/analysis/pipeline/types";

export type EvidenceClickArgs = {
  page: number;
  quote: string;
  findingId?: string;
  startIndex?: number;
  endIndex?: number;
  evidenceId?: string;
  exact?: boolean;
};

export function isAnalysisSuccess(
  response: AnalysisResponse,
): response is Extract<AnalysisResponse, { ok: true }> {
  return response.ok === true;
}

export function parseAnalysisErrorMessage(
  response: Extract<AnalysisResponse, { ok: false }>,
): string {
  if (typeof response.error === "string") return response.error;
  return response.error.message;
}
