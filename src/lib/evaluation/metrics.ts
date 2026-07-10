import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { GroundingSummary } from "@/lib/analysis/pipeline/types";

export function countMaterialClaims(report: BeforeYouSignReport): number {
  return (
    report.moneyAndFees.length +
    report.deadlinesAndNotice.length +
    report.potentialRedFlags.length
  );
}

export function groundingRate(report: BeforeYouSignReport): number {
  const material = countMaterialClaims(report);
  if (material === 0) return 1;
  const grounded =
    report.moneyAndFees.filter((r) => r.evidence?.length).length +
    report.deadlinesAndNotice.filter((r) => r.evidence?.length).length +
    report.potentialRedFlags.filter((f) => f.evidence.length > 0).length;
  return grounded / material;
}

export function unsupportedFindingRate(report: BeforeYouSignReport): number {
  const flags = report.potentialRedFlags;
  if (!flags.length) return 0;
  const unsupported = flags.filter(
    (f) => f.evidence.some((e) => e.supportStatus === "unsupported"),
  ).length;
  return unsupported / flags.length;
}

export function spanOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  if (overlap <= 0) return 0;
  const union = Math.max(aEnd, bEnd) - Math.min(aStart, bStart);
  return union > 0 ? overlap / union : 0;
}

export function summarizeGrounding(summary?: GroundingSummary) {
  if (!summary) return { groundingRate: 1, droppedRate: 0 };
  const total = summary.materialClaims || 1;
  return {
    groundingRate: summary.groundedClaims / total,
    droppedRate: summary.droppedClaims / total,
  };
}
