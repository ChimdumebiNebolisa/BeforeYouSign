import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { AnalysisMode } from "@/lib/analysis/pipeline/types";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { FIXED_REPORT_DISCLAIMER } from "@/lib/public-copy";
import { displayReviewPriority } from "@/lib/display-labels";

function formatEvidence(ev: { page: number; quote: string; evidenceId?: string }): string {
  const page = `p. ${ev.page}`;
  const id = ev.evidenceId ? ` [${ev.evidenceId}]` : "";
  const quote = ev.quote.replace(/\s+/g, " ").trim().slice(0, 160);
  return `${page}${id}: "${quote}"`;
}

function formatModeLabel(mode: AnalysisMode | undefined): string {
  switch (mode) {
    case "model_grounded":
      return "AI-enhanced (evidence-backed)";
    case "rules_only":
      return "Rule-based only";
    case "unavailable":
      return "AI unavailable";
    default:
      return "Unknown";
  }
}

function escapeMd(value: string): string {
  return value.replace(/([\\`*_[\]#])/g, "\\$1");
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

  if (fileName) {
    lines.push(`**Lease:** ${escapeMd(fileName)}`, "");
  }

  lines.push(`**Analysis mode:** ${formatModeLabel(mode)}`, "");

  lines.push("## Summary", "", escapeMd(report.summary), "");

  if (report.whatYoureAgreeingTo.length) {
    lines.push("### What you're agreeing to", "");
    report.whatYoureAgreeingTo.forEach((line) => lines.push(`- ${escapeMd(line)}`));
    lines.push("");
  }

  lines.push(
    "## Review priority",
    "",
    `**${displayReviewPriority(report.riskLevel)}** — ${escapeMd(report.riskReason)}`,
    "",
  );

  if (deterministicRiskBand) {
    lines.push(
      `Pattern scan hint: ${displayReviewPriority(deterministicRiskBand)}`,
      "",
    );
    if (deterministicRiskReasons?.length) {
      deterministicRiskReasons.forEach((reason) => lines.push(`- ${escapeMd(reason)}`));
      lines.push("");
    }
  }

  lines.push("## Money and fees", "");
  if (report.moneyAndFees.length) {
    report.moneyAndFees.forEach((row) => {
      lines.push(`- **${escapeMd(row.label)}:** ${escapeMd(row.value)}`);
      row.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Deadlines and notices", "");
  if (report.deadlinesAndNotice.length) {
    report.deadlinesAndNotice.forEach((row) => {
      lines.push(`- **${escapeMd(row.label)}:** ${escapeMd(row.value)}`);
      row.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Responsibilities", "");
  if (report.responsibilities.length) {
    report.responsibilities.forEach((line) => lines.push(`- ${escapeMd(line)}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Terms to review", "");
  if (report.potentialRedFlags.length) {
    report.potentialRedFlags.forEach((f) => {
      lines.push(`- **${escapeMd(f.title)}** (${f.severity})`);
      if (f.explanation) lines.push(`  - ${escapeMd(f.explanation)}`);
      if (f.whyItMatters) lines.push(`  - Why it matters: ${escapeMd(f.whyItMatters)}`);
      f.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Questions to ask", "");
  if (report.questionsToAsk.length) {
    report.questionsToAsk.forEach((q, i) => lines.push(`${i + 1}. ${escapeMd(q)}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Next steps", "");
  if (report.nextSteps.length) {
    report.nextSteps.forEach((step) => lines.push(`- ${escapeMd(step)}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Texas renter check", "");
  if (texasRenterFindings.length) {
    texasRenterFindings.forEach((f) => {
      lines.push(`- **${escapeMd(f.topicLabel)}**`);
      lines.push(`  - ${escapeMd(f.questionToAsk)}`);
      lines.push(
        `  - Lease quote (p. ${f.page}): "${f.leaseQuote.replace(/\s+/g, " ").trim().slice(0, 160)}"`,
      );
      if (f.sourceUrl) lines.push(`  - Source: ${f.sourceTitle ?? f.sourceUrl}`);
    });
  } else {
    lines.push("- No Texas renter check topics were matched in this lease.");
  }
  lines.push("");

  lines.push("## Missing or unclear", "");
  if (report.missingOrUnclear.length) {
    report.missingOrUnclear.forEach((line) => lines.push(`- ${escapeMd(line)}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  return lines.join("\n");
}
