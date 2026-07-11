import type { FindingSeverity, RiskLevel } from "@/lib/analysis/schema";

type AttentionLevel = RiskLevel | FindingSeverity;

function displayAttentionLevel(level: AttentionLevel): string {
  switch (level) {
    case "low":
    case "minor":
      return "Lower attention";
    case "medium":
    case "moderate":
      return "Moderate attention";
    case "high":
    case "critical":
      return "Higher attention";
  }
}

export function displayReviewPriority(level: RiskLevel): string {
  return displayAttentionLevel(level);
}

export function displaySeverity(severity: FindingSeverity): string {
  return displayAttentionLevel(severity);
}
