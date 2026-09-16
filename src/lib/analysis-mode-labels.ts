import type { AnalysisMode } from "@/lib/analysis/pipeline/types";

const ANALYSIS_MODE_LABELS: Record<
  AnalysisMode,
  { bannerTitle: string; exportLabel: string }
> = {
  model_grounded: {
    bannerTitle: "Pattern-based review",
    exportLabel: "Pattern-based review",
  },
  rules_only: {
    bannerTitle: "Rule-based summary",
    exportLabel: "Rule-based only",
  },
  unavailable: {
    bannerTitle: "Review unavailable",
    exportLabel: "Review unavailable",
  },
};

export function analysisModeBannerTitle(mode: AnalysisMode): string {
  return ANALYSIS_MODE_LABELS[mode].bannerTitle;
}

export function formatAnalysisModeLabel(mode: AnalysisMode | undefined): string {
  if (!mode) return "Unknown";
  return ANALYSIS_MODE_LABELS[mode].exportLabel;
}
