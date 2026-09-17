import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { FIXED_REPORT_DISCLAIMER } from "@/lib/public-copy";
import { displayFindingProvenance } from "@/lib/display-labels";

function escapeMd(value: string): string {
  return value.replace(/([\\`*_[\]#])/g, "\\$1");
}

function formatEvidence(ev: { page: number; quote: string; evidenceId?: string }): string {
  const page = `p. ${ev.page}`;
  const id = ev.evidenceId ? ` [${escapeMd(ev.evidenceId)}]` : "";
  const quote = escapeMd(ev.quote.replace(/\s+/g, " ").trim().slice(0, 120));
  return `${page}${id}: "${quote}"`;
}

export function buildChecklistMarkdown(input: {
  report: BeforeYouSignReport;
  texasRenterFindings: TexasRenterFinding[];
  fileName?: string;
}): string {
  const { report, texasRenterFindings, fileName } = input;
  const lines: string[] = [
    "# BeforeYouSign — Question checklist",
    "",
    FIXED_REPORT_DISCLAIMER,
    "",
  ];

  if (fileName) {
    lines.push(`Lease: ${escapeMd(fileName)}`, "");
  }

  lines.push("## Questions to ask", "");
  if (report.questionsToAsk.length) {
    report.questionsToAsk.forEach((q, i) => lines.push(`${i + 1}. ${escapeMd(q)}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

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

  lines.push("## Terms to review", "");
  if (report.potentialRedFlags.length) {
    report.potentialRedFlags.forEach((f) => {
      lines.push(`- **${escapeMd(f.title)}**`);
      lines.push(`  - Origin: ${escapeMd(displayFindingProvenance(f.provenance))}`);
      if (f.explanation) lines.push(`  - ${escapeMd(f.explanation)}`);
      f.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
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
        `  - Lease quote (p. ${f.page}): "${escapeMd(f.leaseQuote.replace(/\s+/g, " ").trim().slice(0, 120))}"`,
      );
      if (f.sourceUrl) lines.push(`  - Source: ${escapeMd(f.sourceTitle ?? f.sourceUrl)}`);
      if (f.sourceReviewedAt) {
        lines.push(`  - Source last reviewed: ${escapeMd(f.sourceReviewedAt)}`);
      }
      if (f.sourceFreshnessWarning) lines.push(`  - Source note: ${escapeMd(f.sourceFreshnessWarning)}`);
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
