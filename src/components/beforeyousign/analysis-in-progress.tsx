"use client";

import {
  Check,
  FileText,
  Gavel,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Intake =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

const STEPS_UPLOAD = [
  {
    title: "Extracting lease text",
    subDone: "Document received and parsed successfully.",
    subActive: "Running text extraction from your PDF…",
    subPending: "Waiting to extract lease text.",
  },
  {
    title: "Checking key terms",
    subDone: "Rent, deposits, and notice windows identified.",
    subActive: "Identifying rent escalations, maintenance duties, and renewal options.",
    subPending: "Waiting to scan key terms.",
  },
  {
    title: "Identifying potential risks",
    subDone: "Risk signals reviewed against your lease language.",
    subActive: "Scoring clauses that may need a closer look…",
    subPending: "Waiting to begin legal risk assessment.",
  },
  {
    title: "Generating plain-English report",
    subDone: "Report ready with summaries and questions to ask.",
    subActive: "Summarizing complex jargon into actionable insights.",
    subPending: "Waiting to generate your report.",
  },
] as const;

const STEPS_TEXT = [
  {
    title: "Reading lease text",
    subDone: "Full text received and indexed for analysis.",
    subActive: "Indexing paragraphs and numbering pages…",
    subPending: "Waiting to read lease text.",
  },
  ...STEPS_UPLOAD.slice(1),
] as const;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileLabel(intake: Intake): string {
  if (intake.kind === "upload") return intake.file.name;
  if (intake.kind === "sample") return "sample-lease.txt";
  return "pasted-lease.txt";
}

function readySubtitle(intake: Intake): string {
  if (intake.kind === "upload") {
    return `READY FOR ANALYSIS • ${formatBytes(intake.file.size)}`;
  }
  const n = intake.text.length;
  return `READY FOR ANALYSIS • ${n.toLocaleString()} characters`;
}

export function AnalysisInProgressView({ intake }: { intake: Intake }) {
  const variant = intake.kind === "upload" ? "upload" : "text";
  const steps = useMemo(() => (variant === "upload" ? STEPS_UPLOAD : STEPS_TEXT), [variant]);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, 2400);
    return () => window.clearInterval(id);
  }, [steps.length]);

  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setStepProgress(0);
    }, 0);
    const id = window.setInterval(() => {
      setStepProgress((p) => (p >= 96 ? p : p + Math.max(2, Math.round((100 - p) * 0.08))));
    }, 110);
    return () => {
      window.clearTimeout(resetId);
      window.clearInterval(id);
    };
  }, [stepIndex]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 font-sans">
      <main className="bys-float-shadow overflow-hidden rounded-[2rem] bg-[#ffffff] shadow-[0px_24px_64px_rgba(25,28,30,0.06)]">
        <div className="border-b border-[#e8eaef] px-6 py-4 sm:px-10 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-[family-name:var(--font-headline)] text-xs font-bold uppercase tracking-[0.22em] text-[#00246a]">
              Analysis in progress
            </p>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00246a]/40 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00246a]" />
            </span>
          </div>
        </div>

        <div className="grid gap-10 px-6 py-8 sm:gap-12 sm:px-10 sm:py-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="font-[family-name:var(--font-headline)] text-2xl font-extrabold leading-tight tracking-tight text-[#00246a] sm:text-3xl lg:text-[2rem]">
                Securing your future, one clause at a time.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-[#505f76] sm:text-base">
                Our AI curator is meticulously reviewing every line of your agreement.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8eaef]/80 bg-[#f7f9fb] p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ffffff] shadow-sm ring-1 ring-[#e8eaef]">
                  <FileText className="h-6 w-6 text-[#00246a]" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-headline)] text-sm font-bold text-[#191c1e] sm:text-base">
                    {fileLabel(intake)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#757682]">
                    {readySubtitle(intake)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-[#505f76]">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#00246a]" strokeWidth={1.75} aria-hidden />
              <p className="leading-snug">Your data remains encrypted and private.</p>
            </div>
          </div>

          <div className="relative rounded-[1.75rem] bg-[#f2f4f6] p-6 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-[#e0e3e8]/80"
              aria-hidden
            />

            <div
              className="relative pb-14 pr-44 sm:pb-16 sm:pr-52"
              aria-live="polite"
              aria-busy="true"
            >
              <ol className="relative space-y-0">
                {steps.map((step, i) => {
                  const done = i < stepIndex;
                  const current = i === stepIndex;
                  const pending = i > stepIndex;
                  const last = i === steps.length - 1;

                  const sub = done ? step.subDone : current ? step.subActive : step.subPending;

                  return (
                    <li key={step.title} className="flex gap-4 sm:gap-5">
                      {/* Fixed-width track: line centered on column; icons centered in column */}
                      <div className="relative flex w-10 shrink-0 flex-col items-center self-stretch sm:w-11">
                        {!last ? (
                          <span
                            className={[
                              "absolute left-1/2 top-9 bottom-0 w-0.5 -translate-x-1/2 sm:top-10",
                              done ? "bg-[#00246a]" : "bg-[#d8dce2]",
                            ].join(" ")}
                            aria-hidden
                          />
                        ) : null}
                        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
                          {done ? (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00246a] text-white shadow-sm sm:h-10 sm:w-10">
                              <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} aria-hidden />
                            </span>
                          ) : current ? (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbe1ff] shadow-sm ring-2 ring-[#00246a]/15 sm:h-10 sm:w-10">
                              <Loader2 className="h-4 w-4 animate-spin text-[#00246a] sm:h-[18px] sm:w-[18px]" aria-hidden />
                            </span>
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#d8dce2] bg-[#ffffff] text-[#9ca3af] sm:h-10 sm:w-10">
                              {i === 2 ? (
                                <Gavel className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
                              ) : i === 3 ? (
                                <Sparkles className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} aria-hidden />
                              ) : (
                                <span className="text-xs font-bold">{i + 1}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={last ? "min-w-0 flex-1 pb-0" : "min-w-0 flex-1 pb-8 sm:pb-10"}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p
                            className={[
                              "font-[family-name:var(--font-headline)] text-sm font-bold sm:text-[15px]",
                              done || current ? "text-[#00246a]" : "text-[#9ca3af]",
                            ].join(" ")}
                          >
                            {step.title}
                          </p>
                          {current ? (
                            <span className="text-xs font-bold tabular-nums text-[#00246a]">
                              {Math.min(99, Math.round(stepProgress))}%
                            </span>
                          ) : null}
                        </div>
                        <p
                          className={[
                            "mt-1.5 text-[13px] leading-relaxed sm:text-sm",
                            pending ? "italic text-[#9ca3af]" : "text-[#505f76]",
                          ].join(" ")}
                        >
                          {sub}
                        </p>
                        {current ? (
                          <div className="mt-3 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#e0e3e8]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#00246a] to-[#3b6fd9] transition-[width] duration-300 ease-out"
                              style={{ width: `${Math.min(99, stepProgress)}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="pointer-events-none absolute bottom-5 right-5 sm:bottom-6 sm:right-6">
              <div className="flex items-center gap-2 rounded-full border border-[#e8eaef] bg-[#ffffff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#505f76] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e]/50 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                </span>
                Live analysis engine
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
