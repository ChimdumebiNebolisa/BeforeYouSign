"use client";

import type { BeforeYouSignReport, RiskLevel } from "@/lib/analysis/schema";

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

const MAX_AGREE_BULLETS = 6;

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
}: {
  report: BeforeYouSignReport;
  onFlagEvidenceClick: (page: number, quote: string) => void;
}) {
  const summaryIntro = displaySummaryIntro(report.summary);
  const agreeBullets = report.whatYoureAgreeingTo.slice(0, MAX_AGREE_BULLETS);
  const riskNote = displayRiskContext(report.riskReason);

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-[#ffffff] p-5 shadow-[0px_16px_36px_rgba(25,28,30,0.05)] sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="min-w-0 space-y-1.5">
            <p className="font-[family-name:var(--font-headline)] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#757682]">
              Summary
            </p>
            <h2 className="font-[family-name:var(--font-headline)] text-xl font-extrabold tracking-tight text-[#191c1e] sm:text-2xl">
              What You&apos;re Agreeing To
            </h2>
            {summaryIntro ? (
              <p className="mt-3 max-w-xl text-sm leading-snug text-[#444651]">{summaryIntro}</p>
            ) : null}
            {agreeBullets.length ? (
              <ul className="mt-4 max-w-xl list-disc space-y-1.5 pl-4 text-[13px] leading-snug text-[#444651]">
                {agreeBullets.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            className={`shrink-0 rounded-lg px-4 py-3 text-center md:max-w-[11.5rem] ${riskSurfaceClasses(
              report.riskLevel,
            )}`}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#38485d]/90">Risk Level</span>
            <span className="mt-1 block font-[family-name:var(--font-headline)] text-lg font-extrabold uppercase leading-none tracking-tight">
              {report.riskLevel}
            </span>
            {riskNote ? (
              <p className="mt-2 text-left text-[11px] leading-snug text-[#38485d]">{riskNote}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl border-l-4 border-[#ba1a1a]/40 bg-[#ffffff] p-6 pl-5 shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
          <div className="flex items-center gap-3">
            <span className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">
              Potential Red Flags
            </span>
          </div>
          {report.potentialRedFlags.length ? (
            <ul className="space-y-4">
              {report.potentialRedFlags.map((f) => (
                <li key={f.id} className="rounded-xl bg-[#f7f9fb] p-4">
                  <button
                    type="button"
                    className="w-full text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00246a]/25"
                    onClick={() => {
                      const ev = f.evidence[0];
                      if (ev && typeof ev.page === "number" && ev.page >= 1) {
                        onFlagEvidenceClick(ev.page, ev.quote);
                      }
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[family-name:var(--font-headline)] text-sm font-bold text-[#191c1e]">
                        {f.title}
                      </span>
                      <span className="rounded-md bg-[#e0e3e5] px-2 py-0.5 text-[11px] font-semibold text-[#444651]">
                        {f.severity}
                      </span>
                      <span className="text-[11px] text-[#757682]">{f.category}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#444651]">{f.explanation}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#444651]">
                      <span className="font-semibold text-[#191c1e]">Why it matters: </span>
                      {f.whyItMatters}
                    </p>
                    {f.evidence.length ? (
                      <div className="mt-4 space-y-2 border-t border-[#c5c5d3]/25 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#757682]">
                          From your lease
                        </p>
                        <ul className="space-y-2 text-sm text-[#444651]">
                          {f.evidence.map((ev, i) => (
                            <li key={`${f.id}-ev-${i}`}>
                              <span className="font-medium text-[#191c1e]">p. {ev.page}: </span>
                              <q className="break-words">{ev.quote}</q>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-xl border-l-4 border-[#00246a]/40 bg-[#ffffff] p-6 pl-5 shadow-[0px_12px_32px_rgba(25,28,30,0.04)]">
          <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">Money and Fees</h3>
          {report.moneyAndFees.length ? (
            <div className="space-y-3">
              {report.moneyAndFees.map((row, i) => (
                <div
                  key={`${row.label}-${i}`}
                  className="border-b border-[#c5c5d3]/20 py-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-[#444651]">{row.label}</p>
                    <p className="text-sm font-bold text-[#191c1e]">{row.value}</p>
                  </div>
                  {row.evidence?.length ? (
                    <ul className="mt-2 space-y-1 text-xs text-[#757682]">
                      {row.evidence.map((ev, j) => (
                        <li key={`${row.label}-ev-${j}`}>
                          <span className="font-medium text-[#191c1e]">p. {ev.page}: </span>
                          <q className="break-words">{ev.quote}</q>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl bg-[#eceef0] p-6">
          <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">
            Deadlines and Notice Rules
          </h3>
          {report.deadlinesAndNotice.length ? (
            <div className="space-y-3">
              {report.deadlinesAndNotice.map((row, i) => (
                <div key={`${row.label}-${i}`} className="rounded-lg bg-[#ffffff] p-4">
                  <p className="text-sm font-semibold text-[#191c1e]">{row.label}</p>
                  <p className="mt-1 text-sm text-[#444651]">{row.value}</p>
                  {row.evidence?.length ? (
                    <ul className="mt-2 space-y-1 border-t border-[#c5c5d3]/20 pt-2 text-xs text-[#757682]">
                      {row.evidence.map((ev, j) => (
                        <li key={`${row.label}-ev-${j}`}>
                          <span className="font-medium text-[#191c1e]">p. {ev.page}: </span>
                          <q className="break-words">{ev.quote}</q>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-xl bg-[#eceef0] p-6">
          <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">Responsibilities</h3>
          {report.responsibilities.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-[#444651]">
              {report.responsibilities.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#444651]">Not clearly found in this lease text.</p>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-6 rounded-xl bg-[#dbe1ff] p-6 sm:p-8">
        <div>
          <h3 className="font-[family-name:var(--font-headline)] text-xl font-bold text-[#00174b]">
            Questions to Ask Before Signing
          </h3>
          <p className="mt-1 text-sm text-[#003ea8]">Use these in your next conversation with the landlord or agent.</p>
        </div>
        {report.questionsToAsk.length ? (
          <ol className="space-y-3">
            {report.questionsToAsk.map((q, i) => (
              <li
                key={`${i}-${q.slice(0, 24)}`}
                className="flex gap-4 rounded-lg border border-white/30 bg-white/45 p-4"
              >
                <span className="h-fit shrink-0 rounded-md bg-[#00246a] px-2 py-0.5 text-[10px] font-bold text-white">
                  #{i + 1}
                </span>
                <p className="text-sm font-medium leading-snug text-[#00174b]">{q}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-[#003ea8]">Not clearly found in this lease text.</p>
        )}
      </section>

      <section className="rounded-xl bg-[#ffffff] p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.05)] sm:p-8">
        <h3 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">Next Steps</h3>
        {report.nextSteps.length ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#444651]">
            {report.nextSteps.map((s, i) => (
              <li key={`${i}-${s.slice(0, 24)}`}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#444651]">Not clearly found in this lease text.</p>
        )}
        <p className="mt-6 text-xs text-[#757682]">{report.disclaimer}</p>
      </section>

      {report.missingOrUnclear.length ? (
        <section className="rounded-xl bg-[#fff7ed] p-6">
          <h3 className="font-[family-name:var(--font-headline)] text-sm font-bold text-[#7c2d12]">Not clearly found</h3>
          <p className="mt-1 text-xs text-[#9a3412]">
            Could not determine from the uploaded lease with confidence:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#7c2d12]">
            {report.missingOrUnclear.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
