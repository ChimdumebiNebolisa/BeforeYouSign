import type { FindingSeverity, RiskLevel } from "@/lib/analysis/schema";

export function displayReviewPriority(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "Lower attention";
    case "medium":
      return "Moderate attention";
    case "high":
      return "Higher attention";
  }
}

export function displaySeverity(severity: FindingSeverity): string {
  switch (severity) {
    case "minor":
      return "Lower attention";
    case "moderate":
      return "Moderate attention";
    case "critical":
      return "Higher attention";
  }
}
