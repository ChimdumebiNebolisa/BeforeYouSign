"use client";

import { Download } from "lucide-react";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import { buildChecklistMarkdown } from "@/lib/checklist-export";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

export function ChecklistDownloadButton({
  report,
  texasRenterFindings,
  fileName,
}: {
  report: BeforeYouSignReport;
  texasRenterFindings: TexasRenterFinding[];
  fileName?: string;
}) {
  const handleDownload = () => {
    const markdown = buildChecklistMarkdown({ report, texasRenterFindings, fileName });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "beforeyousign-checklist.md";
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
      Download question checklist
    </button>
  );
}
