"use client";

import type { BeforeYouSignReport, RiskLevel } from "@/lib/analysis/schema";

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
  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-[#ffffff] p-6 shadow-[0px_20px_40px_rgba(25,28,30,0.06)] sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="font-[family-name:var(--font-headline)] text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757682]">
              Summary
            </p>
            <h2 className="font-[family-name:var(--font-headline)] text-2xl font-extrabold tracking-tight text-[#191c1e] sm:text-3xl">
              What You&apos;re Agreeing To
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#444651]">{report.summary}</p>
            {report.whatYoureAgreeingTo.length ? (
              <ul className="mt-6 max-w-lg list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#444651]">
                {report.whatYoureAgreeingTo.map((line, i) => (
                  <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div
            className={`flex min-w-[140px] flex-col items-center justify-center rounded-xl p-6 text-center ${riskSurfaceClasses(
              report.riskLevel,
            )}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-tight text-[#38485d]">Risk Level</span>
            <span className="font-[family-name:var(--font-headline)] text-2xl font-black uppercase tracking-tight">
              {report.riskLevel}
            </span>
            <p className="mt-2 max-w-[200px] text-[11px] leading-snug text-[#38485d]">{report.riskReason}</p>
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
