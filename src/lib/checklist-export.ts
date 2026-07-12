import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { FIXED_REPORT_DISCLAIMER } from "@/lib/public-copy";
import { displayFindingProvenance } from "@/lib/display-labels";

function formatEvidence(ev: { page: number; quote: string; evidenceId?: string }): string {
  const page = `p. ${ev.page}`;
  const id = ev.evidenceId ? ` [${ev.evidenceId}]` : "";
  const quote = ev.quote.replace(/\s+/g, " ").trim().slice(0, 120);
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
    lines.push(`Lease: ${fileName}`, "");
  }

  lines.push("## Questions to ask", "");
  if (report.questionsToAsk.length) {
    report.questionsToAsk.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Money and fees", "");
  if (report.moneyAndFees.length) {
    report.moneyAndFees.forEach((row) => {
      lines.push(`- **${row.label}:** ${row.value}`);
      row.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Deadlines and notices", "");
  if (report.deadlinesAndNotice.length) {
    report.deadlinesAndNotice.forEach((row) => {
      lines.push(`- **${row.label}:** ${row.value}`);
      row.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Terms to review", "");
  if (report.potentialRedFlags.length) {
    report.potentialRedFlags.forEach((f) => {
      lines.push(`- **${f.title}**`);
      lines.push(`  - Origin: ${displayFindingProvenance(f.provenance)}`);
      if (f.explanation) lines.push(`  - ${f.explanation}`);
      f.evidence?.forEach((ev) => lines.push(`  - Source: ${formatEvidence(ev)}`));
    });
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Texas renter check", "");
  if (texasRenterFindings.length) {
    texasRenterFindings.forEach((f) => {
      lines.push(`- **${f.topicLabel}**`);
      lines.push(`  - ${f.questionToAsk}`);
      lines.push(`  - Lease quote (p. ${f.page}): "${f.leaseQuote.replace(/\s+/g, " ").trim().slice(0, 120)}"`);
      if (f.sourceUrl) lines.push(`  - Source: ${f.sourceTitle ?? f.sourceUrl}`);
    });
  } else {
    lines.push("- No Texas renter check topics were matched in this lease.");
  }
  lines.push("");

  lines.push("## Missing or unclear", "");
  if (report.missingOrUnclear.length) {
    report.missingOrUnclear.forEach((line) => lines.push(`- ${line}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  return lines.join("\n");
}
