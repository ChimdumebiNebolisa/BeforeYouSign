import type { AnalysisMode } from "@/lib/analysis/pipeline/types";

const ANALYSIS_MODE_LABELS: Record<
  AnalysisMode,
  { bannerTitle: string; exportLabel: string }
> = {
  model_grounded: {
    bannerTitle: "AI-assisted, source-verified summary",
    exportLabel: "AI-assisted with deterministic evidence checks",
  },
  rules_only: {
    bannerTitle: "Rule-based summary",
    exportLabel: "Rule-based only",
  },
};

export function analysisModeBannerTitle(mode: AnalysisMode): string {
  return ANALYSIS_MODE_LABELS[mode].bannerTitle;
}

export function formatAnalysisModeLabel(mode: AnalysisMode | undefined): string {
  if (!mode) return "Unknown";
  return ANALYSIS_MODE_LABELS[mode].exportLabel;
}
