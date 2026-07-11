"use client";

import type { AnalysisMode, GroundingSummary } from "@/lib/analysis/pipeline/types";
import { analysisModeBannerTitle } from "@/lib/analysis-mode-labels";

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
      body = "Key lease details from pattern matching are shown below. AI summarization is not configured or failed.";
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
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${classes}`}>
      <p className="font-[family-name:var(--font-headline)] text-sm font-bold">{title}</p>
      <p className="mt-1">{body}</p>
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
  );
}
