"use client";

import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { AnalysisMode } from "@/lib/analysis/pipeline/types";
import { buildReportMarkdown, sanitizeExportFilename } from "@/lib/report-export";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { DownloadMarkdownButton } from "@/components/beforeyousign/download-markdown-button";

export function ReportDownloadButton({
  report,
  texasRenterFindings,
  fileName,
  mode,
  deterministicRiskBand,
  deterministicRiskReasons,
}: {
  report: BeforeYouSignReport;
  texasRenterFindings: TexasRenterFinding[];
  fileName?: string;
  mode?: AnalysisMode;
  deterministicRiskBand?: "low" | "medium" | "high";
  deterministicRiskReasons?: string[];
}) {
  return (
    <DownloadMarkdownButton
      label="Download full report"
      downloadFileName={fileName ? sanitizeExportFilename(fileName) : "beforeyousign-report.md"}
      buildMarkdown={() =>
        buildReportMarkdown({
          report,
          texasRenterFindings,
          fileName,
          mode,
          deterministicRiskBand,
          deterministicRiskReasons,
        })
      }
    />
  );
}
