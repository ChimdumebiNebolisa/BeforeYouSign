"use client";

import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import { buildChecklistMarkdown } from "@/lib/checklist-export";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import type { StateCode, StateGuidanceStatus } from "@/lib/jurisdiction/states";
import { DownloadMarkdownButton } from "@/components/beforeyousign/download-markdown-button";

export function ChecklistDownloadButton({
  report,
  texasRenterFindings,
  fileName,
  stateCode = "TX",
  stateGuidance,
}: {
  report: BeforeYouSignReport;
  texasRenterFindings: TexasRenterFinding[];
  fileName?: string;
  stateCode?: StateCode;
  stateGuidance?: StateGuidanceStatus;
}) {
  return (
    <DownloadMarkdownButton
      label="Download question checklist"
      downloadFileName="beforeyousign-checklist.md"
      buildMarkdown={() => buildChecklistMarkdown({ report, texasRenterFindings, fileName, stateCode, stateGuidance })}
    />
  );
}
