import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { AnalysisMode } from "@/lib/analysis/pipeline/types";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { FIXED_REPORT_DISCLAIMER } from "@/lib/public-copy";
import { displayFindingProvenance, displayReviewPriority } from "@/lib/display-labels";
import { formatAnalysisModeLabel } from "@/lib/analysis-mode-labels";
import { isClickableGroundedEvidence } from "@/lib/analysis/evidence-click";

function safeText(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

function formatEvidence(ev: { page: number; quote: string; evidenceId?: string }): string {
  const page = `p. ${ev.page}`;
  const id = ev.evidenceId ? ` [${ev.evidenceId}]` : "";
  const quote = safeText(ev.quote).replace(/\s+/g, " ").trim().slice(0, 160);
  return `${page}${id}: "${quote}"`;
}

function formatModeLabel(mode: AnalysisMode | undefined): string {
  return formatAnalysisModeLabel(mode);
}

function escapeMd(value: string): string {
  return value.replace(/([\\`*_[\]#])/g, "\\$1");
}

/** Sanitize a user-provided filename for client-side Markdown download. */
export function sanitizeExportFilename(fileName: string): string {
  const base = fileName
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base.length > 0 ? `${base}-report.md` : "beforeyousign-report.md";
}

export function buildReportMarkdown(input: {
  report: BeforeYouSignReport;
  texasRenterFindings: TexasRenterFinding[];
  fileName?: string;
  mode?: AnalysisMode;
  deterministicRiskBand?: "low" | "medium" | "high";
  deterministicRiskReasons?: string[];
}): string {
  const { report, texasRenterFindings, fileName, mode, deterministicRiskBand, deterministicRiskReasons } =
    input;
  const lines: string[] = [
    "# BeforeYouSign — Lease analysis report",
    "",
    FIXED_REPORT_DISCLAIMER,
    "",
  ];

  if (fileName?.trim()) {
    lines.push(`**Lease:** ${escapeMd(fileName.trim())}`, "");
  }

  lines.push(`**Analysis mode:** ${formatModeLabel(mode)}`, "");

  lines.push("## Summary", "", escapeMd(safeText(report.summary)), "");

  if (report.whatYoureAgreeingTo.length) {
    lines.push("### What you're agreeing to", "");
    report.whatYoureAgreeingTo.forEach((line) => lines.push(`- ${escapeMd(safeText(line))}`));
    lines.push("");
  }

  lines.push(
    "## Review priority",
    "",
    `**${displayReviewPriority(report.riskLevel)}** — ${escapeMd(safeText(report.riskReason))}`,
    "",
  );

  if (deterministicRiskBand) {
    lines.push(`Pattern scan hint: ${displayReviewPriority(deterministicRiskBand)}`, "");
    if (deterministicRiskReasons?.length) {
      deterministicRiskReasons.forEach((reason) => lines.push(`- ${escapeMd(safeText(reason))}`));
      lines.push("");
    }
  }

  lines.push("## Money and fees", "");
  if (report.moneyAndFees.length) {
    report.moneyAndFees.forEach((row) => {
      lines.push(`- **${escapeMd(safeText(row.label))}:** ${escapeMd(safeText(row.value))}`);
      row.evidence
        ?.filter(isClickableGroundedEvidence)
        .forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Deadlines and notices", "");
  if (report.deadlinesAndNotice.length) {
    report.deadlinesAndNotice.forEach((row) => {
      lines.push(`- **${escapeMd(safeText(row.label))}:** ${escapeMd(safeText(row.value))}`);
      row.evidence
        ?.filter(isClickableGroundedEvidence)
        .forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Responsibilities", "");
  if (report.responsibilities.length) {
    report.responsibilities.forEach((line) => lines.push(`- ${escapeMd(safeText(line))}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Terms to review", "");
  if (report.potentialRedFlags.length) {
    report.potentialRedFlags.forEach((f) => {
      lines.push(`- **${escapeMd(safeText(f.title))}** (${f.severity})`);
      lines.push(`  - Origin: ${displayFindingProvenance(f.provenance)}`);
      if (f.explanation) lines.push(`  - ${escapeMd(safeText(f.explanation))}`);
      if (f.whyItMatters) lines.push(`  - Why it matters: ${escapeMd(safeText(f.whyItMatters))}`);
      f.evidence
        ?.filter(isClickableGroundedEvidence)
        .forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Questions to ask", "");
  if (report.questionsToAsk.length) {
    report.questionsToAsk.forEach((q, i) => lines.push(`${i + 1}. ${escapeMd(safeText(q))}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Next steps", "");
  if (report.nextSteps.length) {
    report.nextSteps.forEach((step) => lines.push(`- ${escapeMd(safeText(step))}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Texas renter check", "");
  if (texasRenterFindings.length) {
    texasRenterFindings.forEach((f) => {
      lines.push(`- **${escapeMd(safeText(f.topicLabel))}**`);
      lines.push(`  - ${escapeMd(safeText(f.questionToAsk))}`);
      lines.push(
        `  - Lease quote (p. ${f.page}): "${safeText(f.leaseQuote).replace(/\s+/g, " ").trim().slice(0, 160)}"`,
      );
      if (f.sourceUrl) lines.push(`  - Source: ${f.sourceTitle ?? f.sourceUrl}`);
    });
  } else {
    lines.push("- No Texas renter check topics were matched in this lease.");
  }
  lines.push("");

  lines.push("## Missing or unclear", "");
  if (report.missingOrUnclear.length) {
    report.missingOrUnclear.forEach((line) => lines.push(`- ${escapeMd(safeText(line))}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  return lines.join("\n");
}
