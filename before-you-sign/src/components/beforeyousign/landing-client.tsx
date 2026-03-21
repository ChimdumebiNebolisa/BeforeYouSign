"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";
import { LeaseTextViewer } from "@/components/beforeyousign/lease-text-viewer";
import {
  parseBeforeYouSignReportJson,
  type BeforeYouSignReport,
  type RiskLevel,
} from "@/lib/analysis/schema";

function riskBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "border-emerald-200/80 bg-emerald-50 text-emerald-900";
    case "medium":
      return "border-amber-200/80 bg-amber-50 text-amber-950";
    case "high":
      return "border-red-200/80 bg-red-50 text-red-950";
  }
}

const ANALYSIS_STEP_LABELS_UPLOAD = [
  "Extracting lease text",
  "Checking key terms",
  "Identifying potential risks",
  "Generating plain-English report",
] as const;

const ANALYSIS_STEP_LABELS_TEXT = [
  "Reading lease text",
  "Checking key terms",
  "Identifying potential risks",
  "Generating plain-English report",
] as const;

function AnalysisProgressSteps({
  active,
  variant,
}: {
  active: boolean;
  variant: "upload" | "text";
}) {
  const labels = variant === "upload" ? ANALYSIS_STEP_LABELS_UPLOAD : ANALYSIS_STEP_LABELS_TEXT;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    setStepIndex(0);
    const id = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, labels.length - 1));
    }, 1600);
    return () => window.clearInterval(id);
  }, [active, labels.length]);

  if (!active) return null;

  return (
    <div
      className="mt-4 rounded-xl border border-slate-200/70 bg-white/50 p-3 text-sm text-slate-800"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Progress</p>
      <ol className="mt-2 space-y-2">
        {labels.map((label, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          return (
            <li key={label} className="flex items-start gap-2">
              <span
                className={[
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : current
                      ? "border-slate-400 bg-white text-slate-900"
                      : "border-slate-200/80 bg-white/40 text-slate-400",
                ].join(" ")}
                aria-hidden="true"
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={
                  current ? "font-medium text-slate-900" : done ? "text-slate-700" : "text-slate-400"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type IntakeState =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

export function LandingClient() {
  const [intake, setIntake] = useState<IntakeState | null>(null);
  const [pasteOpenNonce, setPasteOpenNonce] = useState(0);
  const [uploadReceipt, setUploadReceipt] = useState<{
    fileName: string;
    fileSizeBytes: number;
    contentType: string | null;
    extractedPages?: { page: number; text: string }[];
    rentSnippets?: { page: number; quote: string }[];
    depositSnippets?: { page: number; quote: string }[];
    feeSnippets?: { page: number; quote: string }[];
    noticeSnippets?: { page: number; quote: string }[];
    renewalSnippets?: { page: number; quote: string }[];
    maintenanceSnippets?: { page: number; quote: string }[];
    utilitiesSnippets?: { page: number; quote: string }[];
    ruleBasedFindings?: { category: string; page: number; quote: string }[];
    unclearLeasePhrases?: { page: number; quote: string }[];
    deterministicRiskScore?: number;
    deterministicRiskBand?: "low" | "medium" | "high";
    deterministicRiskReasons?: string[];
    report?: BeforeYouSignReport | null;
    reportError?: string | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetIntakeUi = () => {
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
  };

  const runLeaseAnalysis = useCallback(async () => {
    if (!intake) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUploadReceipt(null);

      let res: Response;
      if (intake.kind === "upload") {
        const formData = new FormData();
        formData.append("file", intake.file, intake.file.name);
        res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leaseText: intake.text,
            fileName: intake.kind === "sample" ? "sample-lease.txt" : "pasted-lease.txt",
          }),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        let message = text || `Request failed with ${res.status}`;
        try {
          const errJson = JSON.parse(text) as { error?: unknown };
          if (typeof errJson.error === "string" && errJson.error) {
            message = errJson.error;
          }
        } catch {
          // use raw body or status message
        }
        throw new Error(message);
      }

      const data = (await res.json()) as {
        fileName: string;
        fileSizeBytes: number;
        contentType: string | null;
        extractedPages?: { page: number; text: string }[];
        rentSnippets?: { page: number; quote: string }[];
        depositSnippets?: { page: number; quote: string }[];
        feeSnippets?: { page: number; quote: string }[];
        noticeSnippets?: { page: number; quote: string }[];
        renewalSnippets?: { page: number; quote: string }[];
        maintenanceSnippets?: { page: number; quote: string }[];
        utilitiesSnippets?: { page: number; quote: string }[];
        ruleBasedFindings?: { category: string; page: number; quote: string }[];
        unclearLeasePhrases?: { page: number; quote: string }[];
        deterministicRiskScore?: number;
        deterministicRiskBand?: "low" | "medium" | "high";
        deterministicRiskReasons?: string[];
        report?: unknown;
        reportError?: string | null;
      };

      const report =
        data.report === undefined || data.report === null
          ? null
          : parseBeforeYouSignReportJson(data.report);
      setUploadReceipt({
        ...data,
        report,
        reportError: typeof data.reportError === "string" ? data.reportError : null,
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to run analysis on the server.");
    } finally {
      setIsSubmitting(false);
    }
  }, [intake]);

  if (intake) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center font-sans">
        <main
          className={[
            "flex w-full min-w-0 flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/60 px-4 py-8 backdrop-blur shadow-sm sm:px-6 sm:py-10",
            uploadReceipt ? "max-w-6xl" : "max-w-3xl",
          ].join(" ")}
        >
          <h1 className="text-2xl font-semibold text-slate-900">Lease intake</h1>
          {intake.kind === "upload" ? (
            <p className="text-sm text-slate-700">
              Upload received: <span className="font-medium">{intake.file.name}</span>
            </p>
          ) : null}
          {intake.kind === "sample" ? (
            <p className="text-sm text-slate-700">
              Sample loaded: <span className="font-medium">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}
          {intake.kind === "paste" ? (
            <p className="text-sm text-slate-700">
              Pasted text loaded: <span className="font-medium">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="rounded-full border-slate-200/70 bg-white/40 hover:bg-white/60"
              onClick={() => {
                resetIntakeUi();
                setIntake(null);
              }}
            >
              Back to landing
            </Button>
            <Button
              className="rounded-full"
              onClick={() => void runLeaseAnalysis()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? intake.kind === "upload"
                  ? "Sending PDF..."
                  : "Analyzing text..."
                : "Continue to analysis"}
            </Button>
          </div>

          <AnalysisProgressSteps
            active={isSubmitting}
            variant={intake.kind === "upload" ? "upload" : "text"}
          />

          {uploadReceipt ? (
            <div className="mt-2 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start">
              {uploadReceipt.extractedPages && uploadReceipt.extractedPages.length > 0 ? (
                <div className="w-full min-w-0 lg:w-[55%] lg:max-w-[55%] lg:shrink-0">
                  <LeaseTextViewer pages={uploadReceipt.extractedPages} />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-white/60 p-3 text-sm text-slate-800 sm:p-4">
              Backend received: <span className="font-medium">{uploadReceipt.fileName}</span> (
              {uploadReceipt.fileSizeBytes.toLocaleString()} bytes)
              {uploadReceipt.contentType ? `, ${uploadReceipt.contentType}` : null}
              {uploadReceipt.extractedPages?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Extracted {uploadReceipt.extractedPages.length} page(s). First page snippet:{" "}
                  {uploadReceipt.extractedPages[0]?.text.slice(0, 200) || "—"}
                </div>
              ) : null}
              {uploadReceipt.rentSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Rent mentions found: {uploadReceipt.rentSnippets.length}. Example (page{" "}
                  {uploadReceipt.rentSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.rentSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.depositSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Deposit mentions found: {uploadReceipt.depositSnippets.length}. Example (page{" "}
                  {uploadReceipt.depositSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.depositSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.feeSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Fee mentions found: {uploadReceipt.feeSnippets.length}. Example (page{" "}
                  {uploadReceipt.feeSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.feeSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.noticeSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Notice language found: {uploadReceipt.noticeSnippets.length}. Example (page{" "}
                  {uploadReceipt.noticeSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.noticeSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.renewalSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Renewal language found: {uploadReceipt.renewalSnippets.length}. Example (page{" "}
                  {uploadReceipt.renewalSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.renewalSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.maintenanceSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Maintenance language found: {uploadReceipt.maintenanceSnippets.length}. Example (page{" "}
                  {uploadReceipt.maintenanceSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.maintenanceSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.utilitiesSnippets?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Utilities language found: {uploadReceipt.utilitiesSnippets.length}. Example (page{" "}
                  {uploadReceipt.utilitiesSnippets[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.utilitiesSnippets[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.ruleBasedFindings?.length ? (
                <div className="mt-2 text-xs text-slate-700">
                  Rule-based findings: {uploadReceipt.ruleBasedFindings.length} (page + quote). First:{" "}
                  <span className="font-medium">
                    [{uploadReceipt.ruleBasedFindings[0]?.category}] p.
                    {uploadReceipt.ruleBasedFindings[0]?.page}:{" "}
                    {uploadReceipt.ruleBasedFindings[0]?.quote.slice(0, 120)}
                    {uploadReceipt.ruleBasedFindings[0] &&
                    uploadReceipt.ruleBasedFindings[0].quote.length > 120
                      ? "…"
                      : ""}
                  </span>
                </div>
              ) : null}
              {uploadReceipt.unclearLeasePhrases?.length ? (
                <div className="mt-2 text-xs text-amber-900">
                  Possibly unclear wording flagged: {uploadReceipt.unclearLeasePhrases.length}. Example
                  (p. {uploadReceipt.unclearLeasePhrases[0]?.page}):{" "}
                  <span className="font-medium">{uploadReceipt.unclearLeasePhrases[0]?.quote}</span>
                </div>
              ) : null}
              {uploadReceipt.deterministicRiskBand !== undefined ? (
                <div className="mt-3 rounded-lg border border-slate-200/80 bg-white/50 p-2 text-xs text-slate-800">
                  <div className="font-semibold text-slate-900">
                    Rule-based risk (not legal advice):{" "}
                    <span className="uppercase">{uploadReceipt.deterministicRiskBand}</span> (score{" "}
                    {uploadReceipt.deterministicRiskScore ?? "—"})
                  </div>
                  {uploadReceipt.deterministicRiskReasons?.length ? (
                    <ul className="mt-1 list-inside list-disc text-slate-700">
                      {uploadReceipt.deterministicRiskReasons.map((r, i) => (
                        <li key={`${i}-${r}`}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-slate-600">No strong risk signals from rule scan.</p>
                  )}
                </div>
              ) : null}
              {uploadReceipt.reportError ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                  {uploadReceipt.reportError}
                </div>
              ) : null}
              {uploadReceipt.report ? (
                <div className="mt-3 min-w-0 space-y-3 rounded-lg border border-slate-200/80 bg-white/60 p-3 text-sm text-slate-800 sm:p-4">
                  <h2 className="text-base font-semibold text-slate-900">Structured lease report</h2>
                  <p className="text-slate-700">{uploadReceipt.report.summary}</p>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">What you&apos;re agreeing to</h3>
                    {uploadReceipt.report.whatYoureAgreeingTo.length ? (
                      <ul className="mt-2 list-inside list-disc text-slate-700">
                        {uploadReceipt.report.whatYoureAgreeingTo.map((line, i) => (
                          <li key={`${i}-${line.slice(0, 40)}`}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Risk level</h3>
                    <div className="mt-2 flex flex-col items-start gap-2">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                          riskBadgeClasses(uploadReceipt.report.riskLevel),
                        ].join(" ")}
                      >
                        {uploadReceipt.report.riskLevel}
                      </span>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {uploadReceipt.report.riskReason}
                      </p>
                    </div>
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Potential red flags</h3>
                    {uploadReceipt.report.potentialRedFlags.length ? (
                      <ul className="mt-2 space-y-4">
                        {uploadReceipt.report.potentialRedFlags.map((f) => (
                          <li
                            key={f.id}
                            className="rounded-lg border border-slate-200/60 bg-white/40 p-3 text-slate-800"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{f.title}</span>
                              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
                                {f.severity}
                              </span>
                              <span className="text-xs text-slate-500">{f.category}</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">{f.explanation}</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              <span className="font-medium text-slate-800">Why it matters: </span>
                              {f.whyItMatters}
                            </p>
                            {f.evidence.length ? (
                              <div className="mt-2 border-t border-slate-200/50 pt-2">
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                  From your lease
                                </p>
                                <ul className="mt-1 space-y-1 text-sm text-slate-700">
                                  {f.evidence.map((ev, i) => (
                                    <li key={`${f.id}-ev-${i}`}>
                                      <span className="font-medium text-slate-800">p. {ev.page}: </span>
                                      <q className="break-words text-slate-700">{ev.quote}</q>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Money and fees</h3>
                    {uploadReceipt.report.moneyAndFees.length ? (
                      <ul className="mt-2 space-y-3">
                        {uploadReceipt.report.moneyAndFees.map((row, i) => (
                          <li
                            key={`${row.label}-${i}`}
                            className="rounded-lg border border-slate-200/60 bg-white/40 p-3"
                          >
                            <p className="text-sm font-medium text-slate-900">{row.label}</p>
                            <p className="mt-1 text-sm text-slate-700">{row.value}</p>
                            {row.evidence?.length ? (
                              <ul className="mt-2 space-y-1 border-t border-slate-200/50 pt-2 text-sm text-slate-600">
                                {row.evidence.map((ev, j) => (
                                  <li key={`${row.label}-ev-${j}`}>
                                    <span className="font-medium text-slate-800">p. {ev.page}: </span>
                                    <q className="break-words">{ev.quote}</q>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Deadlines and notice rules</h3>
                    {uploadReceipt.report.deadlinesAndNotice.length ? (
                      <ul className="mt-2 space-y-3">
                        {uploadReceipt.report.deadlinesAndNotice.map((row, i) => (
                          <li
                            key={`${row.label}-${i}`}
                            className="rounded-lg border border-slate-200/60 bg-white/40 p-3"
                          >
                            <p className="text-sm font-medium text-slate-900">{row.label}</p>
                            <p className="mt-1 text-sm text-slate-700">{row.value}</p>
                            {row.evidence?.length ? (
                              <ul className="mt-2 space-y-1 border-t border-slate-200/50 pt-2 text-sm text-slate-600">
                                {row.evidence.map((ev, j) => (
                                  <li key={`${row.label}-ev-${j}`}>
                                    <span className="font-medium text-slate-800">p. {ev.page}: </span>
                                    <q className="break-words">{ev.quote}</q>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Responsibilities</h3>
                    {uploadReceipt.report.responsibilities.length ? (
                      <ul className="mt-2 list-inside list-disc text-slate-700">
                        {uploadReceipt.report.responsibilities.map((line, i) => (
                          <li key={`${i}-${line.slice(0, 40)}`}>{line}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Questions to ask before signing
                    </h3>
                    {uploadReceipt.report.questionsToAsk.length ? (
                      <ul className="mt-2 list-inside list-disc text-slate-700">
                        {uploadReceipt.report.questionsToAsk.map((q, i) => (
                          <li key={`${i}-${q.slice(0, 40)}`}>{q}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  <section className="rounded-xl border border-slate-200/70 bg-white/50 p-3">
                    <h3 className="text-sm font-semibold text-slate-900">Next steps</h3>
                    {uploadReceipt.report.nextSteps.length ? (
                      <ul className="mt-2 list-inside list-disc text-slate-700">
                        {uploadReceipt.report.nextSteps.map((s, i) => (
                          <li key={`${i}-${s.slice(0, 40)}`}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600">Not clearly found in this lease text.</p>
                    )}
                  </section>
                  {uploadReceipt.report.missingOrUnclear.length ? (
                    <section className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
                      <h3 className="text-sm font-semibold text-amber-950">Not clearly found</h3>
                      <p className="mt-1 text-xs text-amber-900/90">
                        Could not determine from the uploaded lease with confidence:
                      </p>
                      <ul className="mt-2 list-inside list-disc text-sm text-amber-950">
                        {uploadReceipt.report.missingOrUnclear.map((line, i) => (
                          <li key={`${i}-${line.slice(0, 40)}`}>{line}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  <p className="text-xs text-slate-500">{uploadReceipt.report.disclaimer}</p>
                </div>
              ) : null}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <h2 className="text-base font-semibold text-red-950">We couldn&apos;t finish analysis</h2>
              <p className="mt-2 leading-relaxed text-red-800">{errorMessage}</p>
              <p className="mt-2 text-xs text-red-800/90">
                Your lease text was not changed. You can retry, go back to pick a different file, or paste the
                text instead.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  className="rounded-full"
                  disabled={isSubmitting}
                  onClick={() => void runLeaseAnalysis()}
                >
                  Try again
                </Button>
                {intake.kind === "upload" ? (
                  <Button
                    variant="outline"
                    className="rounded-full border-red-200 bg-white/70 hover:bg-white"
                    disabled={isSubmitting}
                    onClick={() => {
                      resetIntakeUi();
                      setIntake(null);
                      setPasteOpenNonce((x) => x + 1);
                    }}
                  >
                    Paste Lease Text Instead
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center gap-6 rounded-3xl border border-slate-200/60 bg-white/60 px-5 py-10 backdrop-blur shadow-sm sm:px-8 sm:py-12 sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-slate-900">
            Understand your lease before you sign
          </h1>
          <p className="max-w-md text-lg leading-8 text-slate-600">
            Upload or paste your lease text to understand key terms before you sign.
          </p>

          <UploadLeaseCta
            onStartUpload={(file) => {
              resetIntakeUi();
              setIntake({ kind: "upload", file });
            }}
          />
          <SampleLeaseCta
            onStartSample={(text) => {
              resetIntakeUi();
              setIntake({ kind: "sample", text });
            }}
          />
          <PasteTextDialog
            openRequestVersion={pasteOpenNonce}
            onStartPaste={(text) => {
              resetIntakeUi();
              setIntake({ kind: "paste", text });
            }}
          />
        </div>
      </main>
    </div>
  );
}

