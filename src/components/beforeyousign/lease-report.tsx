"use client";

import { useMemo, useState } from "react";
import type { BeforeYouSignReport, EvidenceRef, RiskLevel } from "@/lib/analysis/schema";

const MAX_SUMMARY_SENTENCES = 4;

/** Display-only: cap intro summary to at most four sentences. */
function displaySummaryIntro(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return t.length > 360 ? `${t.slice(0, 360).trim()}…` : t;
  }
  return parts.slice(0, MAX_SUMMARY_SENTENCES).join(" ");
}

/** Display-only: at most two short sentences for risk context. */
function displayRiskContext(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 2) return t;
  return parts.slice(0, 2).join(" ");
}

/** Display-only: at most `max` sentences for body text. */
function displaySentences(text: string, max: number): string {
  const t = text.trim();
  if (!t) return "";
  const parts = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return t.length > 220 ? `${t.slice(0, 220).trim()}…` : t;
  if (parts.length <= max) return t;
  return parts.slice(0, max).join(" ");
}

function trimQuote(quote: string, maxChars: number): string {
  const q = quote.trim().replace(/\s+/g, " ");
  if (q.length <= maxChars) return q;
  return `${q.slice(0, maxChars).trim()}…`;
}

function dedupeEvidence(evidence: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const ev of evidence) {
    const k = ev.quote.replace(/\s+/g, " ").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(ev);
  }
  return out;
}

const MAX_AGREE_BULLETS = 6;
const INITIAL_QUESTIONS = 5;

const sectionTitle = "font-[family-name:var(--font-headline)] text-base font-bold text-[#191c1e]";
const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.16em] text-[#757682]";
const cardBase = "rounded-lg bg-[#ffffff] p-5 shadow-[0px_10px_28px_rgba(25,28,30,0.045)]";
const cardInset = "rounded-lg border border-[#c5c5d3]/18 bg-[#f7f9fb] p-3";

function riskSurfaceClasses(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-[#d3e4fe] text-[#0b1c30]";
    case "medium":
      return "bg-[#d3e4fe] text-[#0b1c30]";
    case "high":
      return "bg-[#ffdad6] text-[#93000a]";
  }
}

export function LeaseReportView({
  report,
  onFlagEvidenceClick,
  selectedFindingId,
}: {
  report: BeforeYouSignReport;
  onFlagEvidenceClick: (args: { page: number; quote: string; findingId: string }) => void;
  selectedFindingId?: string | null;
}) {
  const summaryIntro = displaySummaryIntro(report.summary);
  const agreeBullets = report.whatYoureAgreeingTo.slice(0, MAX_AGREE_BULLETS);
  const riskNote = displayRiskContext(report.riskReason);

  const [expandedFlagEvidence, setExpandedFlagEvidence] = useState<Record<string, boolean>>({});
  const [expandedMoneyQuotes, setExpandedMoneyQuotes] = useState<Record<string, boolean>>({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const questionsShown = useMemo(() => {
    const all = report.questionsToAsk;
    if (all.length <= INITIAL_QUESTIONS || showAllQuestions) return all;
    return all.slice(0, INITIAL_QUESTIONS);
  }, [report.questionsToAsk, showAllQuestions]);

  const extraQuestionCount = Math.max(0, report.questionsToAsk.length - INITIAL_QUESTIONS);

  return (
    <div className="space-y-5">
      <section className={cardBase}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-5">
          <div className="min-w-0 space-y-1.5">
            <p className={sectionLabel}>Summary</p>
            <h2 className="font-[family-name:var(--font-headline)] text-xl font-extrabold tracking-tight text-[#191c1e] sm:text-2xl">
              What You&apos;re Agreeing To
            </h2>
            {summaryIntro ? (
              <p className="mt-2 max-w-xl text-sm leading-snug text-[#444651]">{summaryIntro}</p>
            ) : null}
            {agreeBullets.length ? (
              <ul className="mt-3 max-w-xl list-disc space-y-1 pl-4 text-[13px] leading-snug text-[#444651]">
                {agreeBullets.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            className={`shrink-0 rounded-lg px-3.5 py-2.5 text-center md:max-w-[11rem] ${riskSurfaceClasses(
              report.riskLevel,
            )}`}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#38485d]/90">Risk Level</span>
            <span className="mt-0.5 block font-[family-name:var(--font-headline)] text-lg font-extrabold uppercase leading-none tracking-tight">
              {report.riskLevel}
            </span>
            {riskNote ? (
              <p className="mt-1.5 text-left text-[11px] leading-snug text-[#38485d]">{riskNote}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className={`${cardBase} border-l-[3px] border-[#ba1a1a]/35 pl-4`}>
          <h3 className={sectionTitle}>Potential Red Flags</h3>
          {report.potentialRedFlags.length ? (
            <ul className="mt-3 space-y-2.5">
              {report.potentialRedFlags.map((f) => {
                const explanation = displaySentences(f.explanation, 3);
                const why = displaySentences(f.whyItMatters, 2);
                const deduped = dedupeEvidence(f.evidence);
                const primary = deduped[0];
                const rest = deduped.slice(1);
                const expanded = expandedFlagEvidence[f.id] ?? false;
                const isSelected = selectedFindingId === f.id;

                return (
                  <li
                    key={f.id}
                    className={[
                      "rounded-lg p-3 transition-colors",
                      isSelected ? "bg-[#eef2ff] ring-1 ring-[#00246a]/22" : "bg-[#f7f9fb]",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      disabled={!primary}
                      className={[
                        "w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00246a]/25",
                        primary ? "cursor-pointer" : "cursor-default opacity-95",
                      ].join(" ")}
                      onClick={() => {
                        const ev = primary;
                        if (ev && typeof ev.page === "number" && ev.page >= 1) {
                          onFlagEvidenceClick({ page: ev.page, quote: ev.quote, findingId: f.id });
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                        <span className="font-[family-name:var(--font-headline)] text-[13px] font-bold text-[#191c1e]">
                          {f.title}
                        </span>
                        <span className="rounded bg-[#e0e3e5] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[#444651]">
                          {f.severity}
                        </span>
                        <span className="rounded border border-[#c5c5d3]/35 bg-[#ffffff]/80 px-1.5 py-px text-[10px] text-[#757682]">
                          {f.category}
                        </span>
                      </div>
                      {explanation ? (
                        <p className="mt-1.5 text-[13px] leading-snug text-[#444651]">{explanation}</p>
                      ) : null}
                      {why ? (
                        <p className="mt-1.5 text-[12px] leading-snug text-[#444651]">
                          <span className="font-semibold text-[#191c1e]">Why it matters: </span>
                          {why}
                        </p>
                      ) : null}
                      {primary ? (
                        <p className="mt-2 text-[11px] leading-snug text-[#505f76]">
                          <span className="font-medium text-[#191c1e]">p. {primary.page}: </span>
                          <q className="text-[#444651]">{trimQuote(primary.quote, 200)}</q>
                        </p>
                      ) : null}
                      {rest.length > 0 ? (
                        <div className="mt-2">
                          {expanded ? (
                            <ul className="space-y-1.5 text-[11px] text-[#505f76]">
                              {rest.map((ev, i) => (
                                <li key={`${f.id}-ev-${i}`}>
                                  <span className="font-medium text-[#191c1e]">p. {ev.page}: </span>
                                  <q className="text-[#444651]">{trimQuote(ev.quote, 160)}</q>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <button
                            type="button"
                            className="mt-1.5 text-[11px] font-medium text-[#003ea8] underline-offset-2 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFlagEvidence((prev) => ({ ...prev, [f.id]: !expanded }));
                            }}
                          >
                            {expanded ? "Hide extra evidence" : `Show more evidence (${rest.length})`}
                          </button>
                        </div>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>

        <section className={`${cardBase} border-l-[3px] border-[#00246a]/35 pl-4`}>
          <h3 className={sectionTitle}>Money and Fees</h3>
          {report.moneyAndFees.length ? (
            <div className="mt-3 space-y-2">
              {report.moneyAndFees.map((row, i) => {
                const key = `${row.label}-${i}`;
                const deduped = row.evidence?.length ? dedupeEvidence(row.evidence) : [];
                const primaryEv = deduped[0];
                const restEv = deduped.slice(1);
                const expanded = expandedMoneyQuotes[key] ?? false;

                return (
                  <div key={key} className="border-b border-[#c5c5d3]/18 py-2 last:border-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-[12px] font-medium text-[#444651]">{row.label}</p>
                      <p className="shrink-0 text-right text-sm font-bold tabular-nums text-[#191c1e]">{row.value}</p>
                    </div>
                    {primaryEv ? (
                      <p className="mt-1 text-[11px] leading-snug text-[#505f76]">
                        <span className="font-medium text-[#191c1e]">p. {primaryEv.page}: </span>
                        <q className="text-[#444651]">{trimQuote(primaryEv.quote, 180)}</q>
                      </p>
                    ) : null}
                    {restEv.length > 0 ? (
                      <div className="mt-1">
                        {expanded ? (
                          <ul className="space-y-1 text-[11px] text-[#505f76]">
                            {restEv.map((ev, j) => (
                              <li key={`${key}-q-${j}`}>
                                <span className="font-medium text-[#191c1e]">p. {ev.page}: </span>
                                <q className="text-[#444651]">{trimQuote(ev.quote, 160)}</q>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <button
                          type="button"
                          className="text-[11px] font-medium text-[#003ea8] underline-offset-2 hover:underline"
                          onClick={() => setExpandedMoneyQuotes((prev) => ({ ...prev, [key]: !expanded }))}
                        >
                          {expanded ? "Hide duplicate quotes" : `Show ${restEv.length} more quote${restEv.length === 1 ? "" : "s"}`}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <section className={`${cardInset} p-4`}>
          <h3 className={sectionTitle}>Deadlines and Notice Rules</h3>
          {report.deadlinesAndNotice.length ? (
            <div className="mt-3 space-y-2">
              {report.deadlinesAndNotice.map((row, i) => (
                <div key={`${row.label}-${i}`} className="rounded-md bg-[#ffffff] p-3 shadow-sm">
                  <p className="text-[13px] font-semibold text-[#191c1e]">{row.label}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[#444651]">{row.value}</p>
                  {row.evidence?.[0] ? (
                    <p className="mt-1.5 text-[11px] text-[#757682]">
                      <span className="font-medium text-[#191c1e]">p. {row.evidence[0].page}: </span>
                      <q>{trimQuote(row.evidence[0].quote, 140)}</q>
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>

        <section className={`${cardInset} p-4`}>
          <h3 className={sectionTitle}>Responsibilities</h3>
          {report.responsibilities.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] leading-snug text-[#444651]">
              {report.responsibilities.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-[#c5c5d3]/22 bg-[#eef2ff]/60 p-4 sm:p-5">
        <h3 className={`${sectionTitle} text-[#00174b]`}>Questions to Ask Before Signing</h3>
        {report.questionsToAsk.length ? (
          <>
            <ol className="mt-2 space-y-1.5">
              {questionsShown.map((q, i) => (
                <li
                  key={`${i}-${q.slice(0, 20)}`}
                  className="flex gap-2 rounded-md bg-[#ffffff]/70 px-2.5 py-1.5 text-[13px] leading-snug text-[#1e3a5f]"
                >
                  <span className="shrink-0 pt-0.5 font-mono text-[10px] font-bold text-[#00246a]/70">
                    {i + 1}.
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
            {extraQuestionCount > 0 ? (
              <button
                type="button"
                className="mt-2 text-[12px] font-medium text-[#003ea8] underline-offset-2 hover:underline"
                onClick={() => setShowAllQuestions((v) => !v)}
              >
                {showAllQuestions ? "Show fewer" : `Show ${extraQuestionCount} more`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
        )}
      </section>

      <section className={`${cardBase} p-4 sm:p-5`}>
        <h3 className={sectionTitle}>Next Steps</h3>
        {report.nextSteps.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-snug text-[#444651]">
            {report.nextSteps.map((s, i) => (
              <li key={`${i}-${s.slice(0, 24)}`}>{displaySentences(s, 3)}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
        )}
        <p className="mt-4 border-t border-[#e6e8ea] pt-3 text-[10px] leading-relaxed text-[#9ca3af]">
          {report.disclaimer}
        </p>
      </section>

      {report.missingOrUnclear.length ? (
        <section className="rounded-lg border border-[#c5c5d3]/25 bg-[#f4f6f8] p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#57534e]">Not clearly found</h3>
          <p className="mt-1 text-[13px] text-[#57534e]">
            We could not determine these confidently from the uploaded lease.
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[13px] leading-snug text-[#44403c]">
            {report.missingOrUnclear.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
