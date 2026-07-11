"use client";

import { Download } from "lucide-react";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { AnalysisMode } from "@/lib/analysis/pipeline/types";
import { buildReportMarkdown, sanitizeExportFilename } from "@/lib/report-export";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

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
  const handleDownload = () => {
    const markdown = buildReportMarkdown({
      report,
      texasRenterFindings,
      fileName,
      mode,
      deterministicRiskBand,
      deterministicRiskReasons,
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName ? sanitizeExportFilename(fileName) : "beforeyousign-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-card px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-muted"
    >
      <Download className="h-4 w-4" aria-hidden />
      Download full report
    </button>
  );
}
