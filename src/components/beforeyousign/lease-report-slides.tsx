import type { Dispatch, SetStateAction } from "react";
import type { BeforeYouSignReport, EvidenceRef, RiskLevel } from "@/lib/analysis/schema";

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
    const k = ev.quote.replace(/\s+/g, " ").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(ev);
  }
  return out;
}

export const MAX_AGREE_BULLETS = 5;
export const INITIAL_QUESTIONS = 4;
/** Max characters per “at a glance” list line (bullets, responsibilities, questions). */
export const SCAN_LINE_CHARS = 160;

export const sectionTitle =
  "font-[family-name:var(--font-headline)] text-base font-bold text-[#191c1e]";
export const sectionLabel = "text-[10px] font-semibold uppercase tracking-[0.16em] text-[#757682]";
export const cardBase = "rounded-lg bg-[#ffffff] p-5 shadow-[0px_10px_28px_rgba(25,28,30,0.045)]";
export const cardInset = "rounded-lg border border-[#c5c5d3]/18 bg-[#f7f9fb] p-3";

export function riskSurfaceClasses(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-[#d3e4fe] text-[#0b1c30]";
    case "medium":
      return "bg-[#d3e4fe] text-[#0b1c30]";
    case "high":
      return "bg-[#ffdad6] text-[#93000a]";
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
  return (
    <section className={cardBase}>
      <div className="flex flex-col gap-4">
        <div
          className={`max-w-md self-center rounded-lg px-3.5 py-2.5 text-center ${riskSurfaceClasses(
            report.riskLevel,
          )}`}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#38485d]/90">Risk Level</span>
          <span className="mt-0.5 block font-[family-name:var(--font-headline)] text-lg font-extrabold uppercase leading-none tracking-tight">
            {report.riskLevel}
          </span>
          {riskNote ? (
            <p className="mt-1.5 text-center text-[11px] leading-snug text-[#38485d]">{riskNote}</p>
          ) : null}
        </div>
        <div className="flex w-full min-w-0 flex-col items-center space-y-1.5 text-center">
          <p className={sectionLabel}>Summary</p>
          <h2 className="font-[family-name:var(--font-headline)] text-xl font-extrabold tracking-tight text-[#191c1e] sm:text-2xl">
            What You&apos;re Agreeing To
          </h2>
          {summaryIntro ? (
            <p className="mt-2 max-w-xl text-sm leading-snug text-[#444651]">{summaryIntro}</p>
          ) : null}
          {agreeBullets.length ? (
            <ul className="mt-3 w-full max-w-xl list-inside list-disc space-y-1.5 text-center text-[13px] leading-snug text-[#444651]">
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
  onFlagEvidenceClick,
}: {
  report: BeforeYouSignReport;
  expandedFlagEvidence: Record<string, boolean>;
  setExpandedFlagEvidence: Dispatch<SetStateAction<Record<string, boolean>>>;
  selectedFindingId?: string | null;
  onFlagEvidenceClick: (args: { page: number; quote: string; findingId: string }) => void;
}) {
  return (
    <section className={`${cardBase} border-l-[3px] border-[#ba1a1a]/35 pl-4`}>
      <h3 className={sectionTitle}>Potential Red Flags</h3>
      {report.potentialRedFlags.length ? (
        <ul className="mt-3 space-y-2.5">
          {report.potentialRedFlags.map((f) => {
            const explanation = displaySentences(f.explanation, 1);
            const why = displaySentences(f.whyItMatters, 1);
            const deduped = dedupeEvidence(f.evidence);
            const primary = deduped[0];
            const rest = deduped.slice(1);
            const expanded = expandedFlagEvidence[f.id] ?? false;
            const isSelected = selectedFindingId === f.id;

            return (
              <li
                key={f.id}
                data-finding-id={f.id}
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
                      {clampForScan(f.title, 100)}
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
                      <q className="text-[#444651]">{trimQuote(primary.quote, 140)}</q>
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
  );
}

export function MoneySection({
  report,
  expandedMoneyQuotes,
  setExpandedMoneyQuotes,
}: {
  report: BeforeYouSignReport;
  expandedMoneyQuotes: Record<string, boolean>;
  setExpandedMoneyQuotes: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  return (
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
                <p className="text-[12px] font-medium leading-snug text-[#444651]">{row.label}</p>
                <p className="mt-1 min-w-0 break-words text-sm font-bold leading-snug text-[#191c1e] [overflow-wrap:anywhere]">
                  {clampForScan(row.value, 220)}
                </p>
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
        <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
      )}
    </section>
  );
}

export function DeadlinesSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className={`${cardInset} p-4`}>
      <h3 className={sectionTitle}>Deadlines and Notice Rules</h3>
      {report.deadlinesAndNotice.length ? (
        <div className="mt-3 space-y-2">
          {report.deadlinesAndNotice.map((row, i) => (
            <div key={`${row.label}-${i}`} className="rounded-md bg-[#ffffff] p-3 shadow-sm">
              <p className="text-[13px] font-semibold text-[#191c1e]">{row.label}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[#444651]">
                {clampForScan(row.value, 200)}
              </p>
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
  );
}

export function ResponsibilitiesSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className={`${cardInset} p-4`}>
      <h3 className={sectionTitle}>Responsibilities</h3>
      {report.responsibilities.length ? (
        <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] leading-snug text-[#444651]">
          {report.responsibilities.map((line, i) => (
            <li key={`${i}-${line.slice(0, 24)}`}>{clampForScan(line, SCAN_LINE_CHARS)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
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
                <span>{clampForScan(q, SCAN_LINE_CHARS)}</span>
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
  );
}

export function NextStepsSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className={`${cardBase} p-4 sm:p-5`}>
      <h3 className={sectionTitle}>Next Steps</h3>
      {report.nextSteps.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-snug text-[#444651]">
          {report.nextSteps.map((s, i) => (
            <li key={`${i}-${s.slice(0, 24)}`}>{displaySentences(s, 2)}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
      )}
      <p className="mt-4 border-t border-[#e6e8ea] pt-3 text-[10px] leading-relaxed text-[#9ca3af]">
        {report.disclaimer}
      </p>
    </section>
  );
}

export function MissingSection({ report }: { report: BeforeYouSignReport }) {
  return (
    <section className="rounded-lg border border-[#c5c5d3]/25 bg-[#f4f6f8] p-4">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#57534e]">Not clearly found</h3>
      <p className="mt-1 text-[13px] text-[#57534e]">
        We could not determine these confidently from the uploaded lease.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[13px] leading-snug text-[#44403c]">
        {report.missingOrUnclear.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`}>{clampForScan(line, SCAN_LINE_CHARS)}</li>
        ))}
      </ul>
    </section>
  );
}
