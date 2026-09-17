"use client";

import type { AnalysisMode, GroundingSummary } from "@/lib/analysis/pipeline/types";
import { analysisModeBannerTitle } from "@/lib/analysis-mode-labels";
import { Eye } from "lucide-react";

export function AnalysisModeBanner({
  mode,
  reportDebug,
  groundingSummary,
  onRetryModel,
  isRetrying,
}: {
  mode?: AnalysisMode;
  reportDebug?: { failureStage?: string } | null;
  groundingSummary?: GroundingSummary;
  onRetryModel?: () => void;
  isRetrying?: boolean;
}) {
  if (!mode) return null;

  let tone: "info" | "warn" | "neutral" = "neutral";
  let title = "";
  let body = "";

  switch (mode) {
    case "model_grounded":
      tone = "info";
      title = analysisModeBannerTitle(mode);
      body = "This report combines rule-based scanning with an AI summary backed by lease evidence.";
      if (groundingSummary && groundingSummary.droppedClaims > 0) {
        body += ` Some AI claims could not be matched to lease text and were omitted.`;
      }
      break;
    case "rules_only":
      if (reportDebug?.failureStage) {
        tone = "warn";
        title = analysisModeBannerTitle(mode);
        body =
          "AI summarization was unavailable for this run. You still have deterministic lease findings below. Retrying may help, but success is not guaranteed.";
      } else {
        tone = "neutral";
        title = analysisModeBannerTitle(mode);
        body = "This report was generated from deterministic lease pattern matching without AI enhancement.";
      }
      break;
    case "unavailable":
      tone = "warn";
      title = analysisModeBannerTitle(mode);
      body =
        "A complete deterministic lease report is shown below. Gemini AI enhancement is not configured for this environment.";
      break;
  }

  const classes =
    tone === "info"
      ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e3a5f]"
      : tone === "warn"
        ? "border-[#fed7aa] bg-[#fffbeb] text-[#9a3412]"
        : "border-[#e0e3e8] bg-[#f7f9fb] text-[#444651]";

  const showRetry = mode === "rules_only" && reportDebug?.failureStage && onRetryModel;

  return (
    <details className="group text-[#444651]">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[#e0e3e8]/80 bg-[#fafbfc] px-3 py-2 text-[11px] font-semibold text-[#505f76] transition hover:bg-[#f7f9fb] [&::-webkit-details-marker]:hidden">
        <Eye className="h-3.5 w-3.5 text-[#00246a]" strokeWidth={1.8} aria-hidden />
        <span>{title}</span>
        <span className="font-normal text-[#9ca3af]">View details</span>
        <span className="ml-auto text-[#757682] transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className={`mt-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${classes}`}>
        <p>{body}</p>
        {showRetry ? (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetryModel}
            className="mt-3 inline-flex h-9 items-center rounded-lg border border-current/20 bg-white/60 px-3 text-xs font-semibold hover:bg-white/90 disabled:opacity-50"
          >
            {isRetrying ? "Retrying AI summary…" : "Retry AI summary"}
          </button>
        ) : null}
      </div>
    </details>
  );
}
