import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { AnnotationSpan, EvaluationFixture } from "@/lib/evaluation/types";

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

export function compareExpectedSets<T extends string>(
  expected: readonly T[],
  actual: readonly T[],
): { precision: number; recall: number; missing: T[]; unexpected: T[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const matched = [...actualSet].filter((value) => expectedSet.has(value)).length;
  return {
    precision: actualSet.size === 0 ? 1 : matched / actualSet.size,
    recall: expectedSet.size === 0 ? 1 : matched / expectedSet.size,
    missing: [...expectedSet].filter((value) => !actualSet.has(value)),
    unexpected: [...actualSet].filter((value) => !expectedSet.has(value)),
  };
}

function canonicalCurrency(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

export function expectedValueAccuracy(
  report: BeforeYouSignReport,
  expected: EvaluationFixture["expected"],
): number {
  const checks: boolean[] = [];
  const actualRent = report.moneyAndFees.find((item) => item.label === "Monthly rent")?.value;
  const actualDeposit = report.moneyAndFees.find((item) => item.label === "Security deposit")?.value;
  if (expected.rentAmount) {
    checks.push(canonicalCurrency(actualRent) === canonicalCurrency(expected.rentAmount));
  }
  if (expected.depositAmount) {
    checks.push(canonicalCurrency(actualDeposit) === canonicalCurrency(expected.depositAmount));
  }
  return checks.length === 0 ? 1 : checks.filter(Boolean).length / checks.length;
}

function annotationMatchesFinding(
  annotation: AnnotationSpan,
  finding: RuleBasedFinding,
  pages: EvaluationFixture["pages"],
): boolean {
  if (annotation.page !== finding.page || annotation.category !== finding.category) return false;
  const pageText = pages.find((page) => page.page === finding.page)?.text ?? "";
  const start = pageText.indexOf(finding.quote);
  if (start < 0) return false;
  return spanOverlap(annotation.start, annotation.end, start, start + finding.quote.length) >= 0.5;
}

export function annotationSpanRecall(
  annotations: readonly AnnotationSpan[],
  findings: readonly RuleBasedFinding[],
  pages: EvaluationFixture["pages"],
): number {
  if (annotations.length === 0) return 1;
  const matched = annotations.filter((annotation) =>
    findings.some((finding) => annotationMatchesFinding(annotation, finding, pages)),
  ).length;
  return matched / annotations.length;
}

export function unmatchedAnnotations(
  annotations: readonly AnnotationSpan[],
  findings: readonly RuleBasedFinding[],
  pages: EvaluationFixture["pages"],
): AnnotationSpan[] {
  return annotations.filter(
    (annotation) => !findings.some((finding) => annotationMatchesFinding(annotation, finding, pages)),
  );
}
