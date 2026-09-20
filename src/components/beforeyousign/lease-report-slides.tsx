"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { BeforeYouSignReport, EvidenceRef, RiskLevel } from "@/lib/analysis/schema";
import type { EvidenceClickArgs, EvidenceNavigationTarget } from "@/lib/analysis/api-schema";
import { isClickableGroundedEvidence } from "@/lib/analysis/evidence-click";
import { displayFindingProvenance, displayReviewPriority, displaySeverity } from "@/lib/display-labels";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { SourceBadge } from "@/components/beforeyousign/source-badge";
import {
  CITY_RULES_NOT_CHECKED_BADGE,
  FIXED_REPORT_DISCLAIMER,
  FOUND_IN_LEASE_BADGE,
  GENERAL_GUIDANCE_BADGE,
  LOCAL_LAW_BANNER,
  MISSING_UNCLEAR_BADGE,
  TEXAS_RENTER_CHECK_BADGE,
  TEXAS_RENTER_CHECK_EMPTY,
  TEXAS_RENTER_CHECK_NOTE,
} from "@/lib/public-copy";

export type EvidenceSourceLabel = "sample lease" | "pasted text";

const MAX_SUMMARY_SENTENCES = 2;
const MAX_SUMMARY_CHARS = 320;

/** Shorten running text for a quick scan (word-aware ellipsis). */
export function clampForScan(text: string, maxChars: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t || t.length <= maxChars) return t;
  const slice = t.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > maxChars * 0.55 ? slice.slice(0, lastSpace).trimEnd() : slice.trimEnd();
  return `${base}…`;
}

export function displaySummaryIntro(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let out: string;
  if (parts.length === 0) {
    out = t.length > MAX_SUMMARY_CHARS ? `${t.slice(0, MAX_SUMMARY_CHARS).trim()}…` : t;
  } else {
    out = parts.slice(0, MAX_SUMMARY_SENTENCES).join(" ");
  }
  return clampForScan(out, MAX_SUMMARY_CHARS);
}

export function displayRiskContext(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return clampForScan(t, 300);
  }
  const joined = parts.length <= 2 ? parts.join(" ") : `${parts[0]} ${parts[1]}`;
  return clampForScan(joined, 300);
}

export function displaySentences(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  let out: string;
  if (parts.length === 0) {
    out = t.length > 180 ? `${t.slice(0, 180).trim()}…` : t;
  } else if (parts.length <= max) {
    out = parts.join(" ");
  } else {
    out = parts.slice(0, max).join(" ");
  }
  const cap = max <= 1 ? 200 : max === 2 ? 320 : 420;
  return clampForScan(out, cap);
}

export function trimQuote(quote: string, maxChars: number): string {
  const q = quote.trim().replace(/\s+/g, " ");
  if (q.length <= maxChars) return q;
  return `${q.slice(0, maxChars).trim()}…`;
}

export function dedupeEvidence(evidence: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const ev of evidence) {
    const k =
      typeof ev.startIndex === "number" && typeof ev.endIndex === "number"
        ? `${ev.page}:${ev.startIndex}:${ev.endIndex}`
        : ev.evidenceId ?? ev.quote.replace(/\s+/g, " ").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(ev);
  }
  return out;
}

function toEvidenceClick(ev: EvidenceRef, findingId?: string): EvidenceClickArgs | null {
  if (!isClickableGroundedEvidence(ev)) return null;
  return {
    page: ev.page,
    quote: ev.quote,
    findingId,
    startIndex: ev.startIndex,
    endIndex: ev.endIndex,
    evidenceId: ev.evidenceId,
    exact: true,
  };
}

function InlineEvidence({
  evidence,
  findingId,
  returnFocusId,
  originLabel,
  evidenceSourceLabel,
  expanded,
  onExpandedChange,
  onOpenEvidence,
}: {
  evidence: EvidenceRef;
  findingId?: string;
  returnFocusId: string;
  originLabel: string;
  evidenceSourceLabel?: EvidenceSourceLabel;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
}) {
  const clickArgs = toEvidenceClick(evidence, findingId);
  if (!clickArgs) return null;

  return (
    <div className="mt-3 border-t border-border/25 pt-3">
      <button
        type="button"
        className="inline-flex min-h-11 items-center text-xs font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:hidden"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        {expanded ? "Hide evidence" : "Show evidence"}
      </button>
      <p className={["text-[11px] leading-relaxed text-muted-foreground", expanded ? "block" : "hidden sm:block"].join(" ")}>
        <span className="font-semibold text-foreground">{evidenceLabel(evidence.page, evidenceSourceLabel)}</span>
        <q className="text-muted-foreground">{trimQuote(evidence.quote, 220)}</q>
      </p>
      <button
        id={returnFocusId}
        type="button"
        className={[
          "mt-2 min-h-11 text-xs font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
          expanded ? "inline-flex items-center" : "hidden sm:inline-flex sm:items-center",
        ].join(" ")}
        onClick={() => onOpenEvidence({ ...clickArgs, returnFocusId, originLabel })}
      >
        View in full lease
      </button>
    </div>
  );
}

export function evidenceLabel(page: number, evidenceSourceLabel?: EvidenceSourceLabel): string {
  return evidenceSourceLabel ? `Source quote · ${evidenceSourceLabel}: ` : `Source quote · p. ${page}: `;
}

export const MAX_AGREE_BULLETS = 5;
export const INITIAL_QUESTIONS = 4;
/** Max characters per “at a glance” list line (bullets, responsibilities, questions). */
export const SCAN_LINE_CHARS = 160;

type InlineEvidenceStateProps = {
  expandedInlineEvidence: Record<string, boolean>;
  setExpandedInlineEvidence: Dispatch<SetStateAction<Record<string, boolean>>>;
};

export const sectionTitle =
  "font-[family-name:var(--font-headline)] text-base font-bold text-foreground";
export const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground";
export const cardBase = "border-y border-border bg-transparent py-4 sm:py-5";
export const cardInset = "border-y border-border bg-secondary/45 p-4";

export function riskSurfaceClasses(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-success-surface text-success";
    case "medium":
      return "bg-warning-surface text-warning";
    case "high":
      return "bg-warning-surface text-warning";
  }
}

export function SummarySection({
  report,
  summaryIntro,
  agreeBullets,
  riskNote,
}: {
  report: BeforeYouSignReport;
  summaryIntro: string;
  agreeBullets: string[];
  riskNote: string;
}) {
  const [showPriorityInfo, setShowPriorityInfo] = useState(false);
  return (
    <section className={cardBase}>
      <div className="flex flex-col gap-3">
        <div className="flex max-w-md flex-col items-center self-center text-center">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${riskSurfaceClasses(
              report.riskLevel,
            )}`}
          >
            <span>Review priority</span>
            <span aria-hidden="true">·</span>
            <strong>{displayReviewPriority(report.riskLevel)}</strong>
          </span>
          <button
            type="button"
            aria-expanded={showPriorityInfo}
            aria-controls="review-priority-info"
            onClick={() => setShowPriorityInfo((v) => !v)}
            className="inline-flex min-h-11 items-center text-[10px] font-semibold text-primary underline underline-offset-2 hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          >
            {showPriorityInfo ? "Hide explanation" : "What does this mean?"}
          </button>
          {showPriorityInfo ? (
            <p id="review-priority-info" className="border-y border-border bg-card/60 px-2.5 py-1.5 text-center text-[11px] leading-snug text-muted-foreground">
              Review priority estimates how much attention lease terms may need. Higher means more items worth a closer
              look; lower means fewer notable items were found. This is not legal advice.
            </p>
          ) : null}
          {riskNote ? (
            <p className="mt-1.5 text-center text-[11px] leading-snug text-muted-foreground">{riskNote}</p>
          ) : null}
        </div>
        <div className="flex w-full min-w-0 flex-col items-center space-y-1.5 text-center">
          <h2 className="font-[family-name:var(--font-headline)] text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            What You&apos;re Agreeing To
          </h2>
          {summaryIntro ? (
            <p className="mt-2 hidden max-w-xl text-sm leading-snug text-muted-foreground sm:block">{summaryIntro}</p>
          ) : null}
          {agreeBullets.length ? (
            <ul className="mt-3 w-full max-w-xl list-inside list-disc space-y-1.5 text-center text-[13px] leading-snug text-muted-foreground">
              {agreeBullets.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function RedFlagsSection({
  report,
  expandedFlagEvidence,
  setExpandedFlagEvidence,
  selectedFindingId,
  onOpenEvidence,
  evidenceSourceLabel,
  expandedInlineEvidence,
  setExpandedInlineEvidence,
}: {
  report: BeforeYouSignReport;
  expandedFlagEvidence: Record<string, boolean>;
  setExpandedFlagEvidence: Dispatch<SetStateAction<Record<string, boolean>>>;
  selectedFindingId?: string | null;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
  evidenceSourceLabel?: EvidenceSourceLabel;
} & InlineEvidenceStateProps) {
  return (
    <section className={cardBase}>
      <h3 className={sectionTitle}>Terms to review</h3>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
        Grounded items show their source quote here. Use “View in full lease” to inspect the verified span.
      </p>
      {report.potentialRedFlags.length ? (
        <ul className="mt-3 space-y-2.5">
          {report.potentialRedFlags.map((f) => {
            const explanation = displaySentences(f.explanation, 1);
            const why = displaySentences(f.whyItMatters, 1);
            const deduped = dedupeEvidence(f.evidence.filter(isClickableGroundedEvidence));
            const primary = deduped[0];
            const rest = deduped.slice(1);
            const expanded = expandedFlagEvidence[f.id] ?? false;
            const isSelected = selectedFindingId === f.id;
            const returnFocusId = `report-finding-${f.id}`;

            return (
              <li
                key={f.id}
                data-finding-id={f.id}
                className={[
                  "border-b border-border/70 px-1 py-4 transition-colors last:border-b-0",
                  isSelected ? "bg-evidence-surface/70" : "bg-transparent",
                ].join(" ")}
              >
                <div className="w-full text-left">
                  <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                    <span className="font-[family-name:var(--font-headline)] text-[13px] font-bold text-foreground">
                      {clampForScan(f.title, 100)}
                    </span>
                    <SourceBadge label={primary ? FOUND_IN_LEASE_BADGE : GENERAL_GUIDANCE_BADGE} />
                    <SourceBadge label={displayFindingProvenance(f.provenance)} />
                    <span className="rounded bg-muted px-1.5 py-px text-[10px] font-semibold tracking-wide text-foreground">
                      {displaySeverity(f.severity)}
                    </span>
                    <span className="rounded border border-border/35 bg-card/80 px-1.5 py-px text-[10px] text-muted-foreground">
                      {f.category}
                    </span>
                  </div>
                  {explanation ? (
                    <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{explanation}</p>
                  ) : null}
                  {why ? (
                    <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
                      <span className="font-semibold text-foreground">Why it matters: </span>
                      {why}
                    </p>
                  ) : null}
                  {primary ? (
                    <InlineEvidence
                      evidence={primary}
                      findingId={f.id}
                      returnFocusId={returnFocusId}
                      originLabel={f.title}
                      evidenceSourceLabel={evidenceSourceLabel}
                      expanded={expandedInlineEvidence[returnFocusId] ?? false}
                      onExpandedChange={(nextExpanded) =>
                        setExpandedInlineEvidence((previous) => ({ ...previous, [returnFocusId]: nextExpanded }))
                      }
                      onOpenEvidence={onOpenEvidence}
                    />
                  ) : (
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      This item is useful review guidance, but it is not linked to a verified lease passage.
                    </p>
                  )}
                </div>
                {rest.length > 0 ? (
                  <div className="mt-2">
                    {expanded ? (
                      <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                        {rest.map((ev, i) => (
                          <li key={`${f.id}-ev-${i}`}>
                            <span className="font-medium text-foreground">{evidenceLabel(ev.page, evidenceSourceLabel)}</span>
                            <q className="text-muted-foreground">{trimQuote(ev.quote, 160)}</q>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center text-[11px] font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      onClick={() => {
                        setExpandedFlagEvidence((prev) => ({ ...prev, [f.id]: !expanded }));
                      }}
                    >
                      {expanded ? "Hide extra evidence" : `Show more evidence (${rest.length})`}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No major issues were clearly identified in this lease text.</p>
      )}
    </section>
  );
}

export function MoneySection({
  report,
  expandedMoneyQuotes,
  setExpandedMoneyQuotes,
  evidenceSourceLabel,
  onOpenEvidence,
  expandedInlineEvidence,
  setExpandedInlineEvidence,
}: {
  report: BeforeYouSignReport;
  expandedMoneyQuotes: Record<string, boolean>;
  setExpandedMoneyQuotes: Dispatch<SetStateAction<Record<string, boolean>>>;
  evidenceSourceLabel?: EvidenceSourceLabel;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
} & InlineEvidenceStateProps) {
  return (
    <section className={cardBase}>
      <h3 className={sectionTitle}>Money and Fees</h3>
      {report.moneyAndFees.length ? (
        <div className="mt-3 space-y-2">
          {report.moneyAndFees.map((row, i) => {
            const key = `${row.label}-${i}`;
            const deduped = row.evidence?.length
              ? dedupeEvidence(row.evidence.filter(isClickableGroundedEvidence))
              : [];
            const primaryEv = deduped[0];
            const restEv = deduped.slice(1);
            const expanded = expandedMoneyQuotes[key] ?? false;
            const returnFocusId = `report-money-${i}`;

            return (
              <div key={key} className="border-b border-border/20 py-2 last:border-0 last:pb-0">
                <div className="block w-full text-left">
                  <p className="text-[12px] font-medium leading-snug text-muted-foreground">{row.label}</p>
                  <p className="mt-1 min-w-0 break-words text-sm font-bold leading-snug text-foreground [overflow-wrap:anywhere]">
                    {clampForScan(row.value, 220)}
                  </p>
                  {primaryEv ? (
                    <InlineEvidence
                      evidence={primaryEv}
                      returnFocusId={returnFocusId}
                      originLabel={row.label}
                      evidenceSourceLabel={evidenceSourceLabel}
                      expanded={expandedInlineEvidence[returnFocusId] ?? false}
                      onExpandedChange={(nextExpanded) =>
                        setExpandedInlineEvidence((previous) => ({ ...previous, [returnFocusId]: nextExpanded }))
                      }
                      onOpenEvidence={onOpenEvidence}
                    />
                  ) : null}
                </div>
                {restEv.length > 0 ? (
                  <div className="mt-1">
                    {expanded ? (
                      <ul className="space-y-1 text-[11px] text-muted-foreground">
                        {restEv.map((ev, j) => (
                          <li key={`${key}-q-${j}`}>
                            <span className="font-medium text-foreground">{evidenceLabel(ev.page, evidenceSourceLabel)}</span>
                            <q className="text-muted-foreground">{trimQuote(ev.quote, 160)}</q>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center text-[11px] font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                      onClick={() => setExpandedMoneyQuotes((prev) => ({ ...prev, [key]: !expanded }))}
                    >
                      {expanded
                        ? "Hide duplicate quotes"
                        : `Show ${restEv.length} more quote${restEv.length === 1 ? "" : "s"}`}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No specific charges were clearly identified in this section of the lease.</p>
      )}
    </section>
  );
}

export function DeadlinesSection({
  report,
  evidenceSourceLabel,
  onOpenEvidence,
  expandedInlineEvidence,
  setExpandedInlineEvidence,
}: {
  report: BeforeYouSignReport;
  evidenceSourceLabel?: EvidenceSourceLabel;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
} & InlineEvidenceStateProps) {
  return (
    <section className={`${cardInset} p-4`}>
      <h3 className={sectionTitle}>Deadlines and Notice Rules</h3>
      {report.deadlinesAndNotice.length ? (
        <div className="mt-3 space-y-2">
          {report.deadlinesAndNotice.map((row, i) => {
            const grounded = row.evidence?.filter(isClickableGroundedEvidence) ?? [];
            const primaryEv = grounded[0];
            const returnFocusId = `report-deadline-${i}`;

            return (
              <div
                key={`${row.label}-${i}`}
                className="block w-full border-b border-border bg-transparent py-3 text-left last:border-b-0"
              >
                <p className="text-[13px] font-semibold text-foreground">{row.label}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {clampForScan(row.value, 200)}
                </p>
                {primaryEv ? (
                  <InlineEvidence
                    evidence={primaryEv}
                    returnFocusId={returnFocusId}
                    originLabel={row.label}
                    evidenceSourceLabel={evidenceSourceLabel}
                    expanded={expandedInlineEvidence[returnFocusId] ?? false}
                    onExpandedChange={(nextExpanded) =>
                      setExpandedInlineEvidence((previous) => ({ ...previous, [returnFocusId]: nextExpanded }))
                    }
                    onOpenEvidence={onOpenEvidence}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Notice periods and deadlines were not clearly stated here.</p>
      )}
    </section>
  );
}

export function ResponsibilitiesSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className={`${cardInset} p-4`}>
      <h3 className={sectionTitle}>Responsibilities</h3>
      {report.responsibilities.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] leading-snug text-muted-foreground">
          {report.responsibilities.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{clampForScan(line, SCAN_LINE_CHARS)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Responsibilities were not clearly split between tenant and landlord.</p>
      )}
    </section>
  );
}

export function QuestionsSection({
  report,
  questionsShown,
  showAllQuestions,
  setShowAllQuestions,
  extraQuestionCount,
}: {
  report: BeforeYouSignReport;
  questionsShown: string[];
  showAllQuestions: boolean;
  setShowAllQuestions: Dispatch<SetStateAction<boolean>>;
  extraQuestionCount: number;
}) {
  return (
    <section className="border-y border-evidence/30 bg-evidence-surface/60 p-4 sm:p-5">
      <h3 className={`${sectionTitle} text-primary`}>Questions to Ask Before Signing</h3>
      {report.questionsToAsk.length ? (
        <>
          <ol className="mt-2 space-y-1.5">
            {questionsShown.map((q, i) => (
              <li
                key={`${i}-${q.slice(0, 20)}`}
                className="flex gap-2 border-b border-evidence/20 px-1 py-2 text-[13px] leading-snug text-primary last:border-b-0"
              >
                <span className="shrink-0 pt-0.5 font-mono text-[10px] font-bold text-primary/70">
                  {i + 1}.
                </span>
                <span>{clampForScan(q, SCAN_LINE_CHARS)}</span>
              </li>
            ))}
          </ol>
          {extraQuestionCount > 0 ? (
            <button
              type="button"
              className="mt-2 inline-flex min-h-11 items-center text-[12px] font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              onClick={() => setShowAllQuestions((v) => !v)}
            >
              {showAllQuestions ? "Show fewer" : `Show ${extraQuestionCount} more`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No specific follow-up questions were generated for this lease.</p>
      )}
    </section>
  );
}

export function TexasRenterCheckSection({
  findings,
  selectedFindingId,
  onOpenEvidence,
  evidenceSourceLabel,
  expandedInlineEvidence,
  setExpandedInlineEvidence,
}: {
  findings: TexasRenterFinding[];
  selectedFindingId?: string | null;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
  evidenceSourceLabel?: EvidenceSourceLabel;
} & InlineEvidenceStateProps) {
  return (
    <section className={cardBase}>
      <h3 className={sectionTitle}>Texas renter check</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{TEXAS_RENTER_CHECK_NOTE}</p>
      {findings.length ? (
        <ul className="mt-4 space-y-3">
          {findings.map((f) => {
            const isSelected = selectedFindingId === f.id;
            const evidence: EvidenceRef | null =
              f.evidenceId && typeof f.startIndex === "number" && typeof f.endIndex === "number"
                ? {
                    page: f.page,
                    quote: f.leaseQuote,
                    evidenceId: f.evidenceId,
                    startIndex: f.startIndex,
                    endIndex: f.endIndex,
                    supportStatus: "grounded",
                  }
                : null;
            return (
              <li
                key={f.id}
                data-finding-id={f.id}
                className={[
                  "rounded-lg border p-4 transition-colors",
                  isSelected
                    ? "border-primary/25 bg-evidence-surface ring-1 ring-ring/15"
                    : "border-border/25 bg-secondary",
                ].join(" ")}
              >
                <div className="w-full text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SourceBadge label={TEXAS_RENTER_CHECK_BADGE} />
                    <SourceBadge label={evidence ? FOUND_IN_LEASE_BADGE : GENERAL_GUIDANCE_BADGE} />
                  </div>
                  <p className={`${sectionLabel} mt-2`}>Topic</p>
                  <p className="mt-0.5 font-[family-name:var(--font-headline)] text-[13px] font-bold text-foreground">
                    {f.topicLabel}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Lease text
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                    <q>{trimQuote(f.leaseQuote, 200)}</q>
                  </p>
                  <p className="mt-3 text-[12px] leading-snug text-muted-foreground">
                    <span className="font-semibold text-foreground">Why it matters: </span>
                    {f.explanation}
                  </p>
                  <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                    <span className="font-semibold text-foreground">Question to ask: </span>
                    {f.questionToAsk}
                  </p>
                  {evidence ? (
                    <InlineEvidence
                      evidence={evidence}
                      findingId={f.id}
                      returnFocusId={`report-texas-${f.id}`}
                      originLabel={f.topicLabel}
                      evidenceSourceLabel={evidenceSourceLabel}
                      expanded={expandedInlineEvidence[`report-texas-${f.id}`] ?? false}
                      onExpandedChange={(nextExpanded) =>
                        setExpandedInlineEvidence((previous) => ({
                          ...previous,
                          [`report-texas-${f.id}`]: nextExpanded,
                        }))
                      }
                      onOpenEvidence={onOpenEvidence}
                    />
                  ) : null}
                </div>
                <div className="mt-3 border-t border-border/20 pt-3 text-[12px] leading-relaxed text-muted-foreground">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Source</p>
                  {f.sourceUrl ? (
                    <p className="mt-1">
                      <a
                        href={f.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-link underline-offset-2 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {f.sourceTitle ?? "Texas renter resource"}
                      </a>
                      {f.sourceSectionLabel ? (
                        <span className="mt-1 block text-[11px] text-muted-foreground">{f.sourceSectionLabel}</span>
                      ) : null}
                      {f.sourceReviewedAt ? (
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          Source last reviewed: {f.sourceReviewedAt}
                        </span>
                      ) : null}
                      {f.sourceFreshnessWarning ? (
                        <span className="mt-2 block rounded-md border border-warning/30 bg-warning-surface px-2 py-1 text-[11px] text-warning">
                          {f.sourceFreshnessWarning}
                        </span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Contextual source under review. Lease wording match only.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{TEXAS_RENTER_CHECK_EMPTY}</p>
      )}
    </section>
  );
}

export function NextStepsSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className={`${cardBase} p-4 sm:p-5`}>
      <h3 className={sectionTitle}>Next Steps</h3>
      {report.nextSteps.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-snug text-muted-foreground">
          {report.nextSteps.map((s, i) => (
            <li key={`${i}-${s.slice(0, 24)}`}>{displaySentences(s, 2)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No next-step recommendations were generated for this lease.</p>
      )}
    </section>
  );
}

export function LocalLawBanner() {
  return (
    <div className="rounded-lg border border-border/35 bg-secondary px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
      <div className="flex flex-wrap items-start gap-2">
        <SourceBadge label={CITY_RULES_NOT_CHECKED_BADGE} />
        <p className="min-w-0 flex-1">{LOCAL_LAW_BANNER}</p>
      </div>
    </div>
  );
}

export function FixedReportDisclaimer({ report }: { report: BeforeYouSignReport }) {
  const reportDisclaimer = report.disclaimer?.trim();
  const showReportDisclaimer =
    reportDisclaimer &&
    reportDisclaimer.toLowerCase() !== FIXED_REPORT_DISCLAIMER.toLowerCase();

  return (
    <div className="rounded-lg border border-border bg-secondary px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
      <p>{FIXED_REPORT_DISCLAIMER}</p>
      {showReportDisclaimer ? (
        <p className="mt-2 text-[10px] text-muted-foreground">{reportDisclaimer}</p>
      ) : null}
    </div>
  );
}

export function MissingSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className="rounded-lg border border-border/25 bg-muted p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Not clearly stated</h3>
        <SourceBadge label={MISSING_UNCLEAR_BADGE} />
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        We could not determine these confidently from the uploaded lease.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[13px] leading-snug text-muted-foreground">
        {report.missingOrUnclear.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`}>{clampForScan(line, SCAN_LINE_CHARS)}</li>
        ))}
      </ul>
    </section>
  );
}
