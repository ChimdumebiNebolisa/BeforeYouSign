import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { FIXED_REPORT_DISCLAIMER } from "@/lib/public-copy";

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
    report.moneyAndFees.forEach((row) => lines.push(`- **${row.label}:** ${row.value}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Deadlines and notices", "");
  if (report.deadlinesAndNotice.length) {
    report.deadlinesAndNotice.forEach((row) => lines.push(`- **${row.label}:** ${row.value}`));
  } else {
    lines.push("- None listed in this report.");
  }
  lines.push("");

  lines.push("## Terms to review", "");
  if (report.potentialRedFlags.length) {
    report.potentialRedFlags.forEach((f) => {
      lines.push(`- **${f.title}**`);
      if (f.explanation) lines.push(`  - ${f.explanation}`);
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
