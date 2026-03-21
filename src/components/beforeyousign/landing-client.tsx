"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";
import { LeaseTextViewer } from "@/components/beforeyousign/lease-text-viewer";
import { LeaseReportView } from "@/components/beforeyousign/lease-report";
import { parseBeforeYouSignReportJson, type BeforeYouSignReport } from "@/lib/analysis/schema";

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

function AnalysisProgressSteps({ variant }: { variant: "upload" | "text" }) {
  const labels = variant === "upload" ? ANALYSIS_STEP_LABELS_UPLOAD : ANALYSIS_STEP_LABELS_TEXT;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, labels.length - 1));
    }, 1600);
    return () => window.clearInterval(id);
  }, [labels.length]);

  return (
    <div className="mt-6 rounded-[2rem] bg-[#f2f4f6] p-6 sm:p-8" aria-live="polite" aria-busy="true">
      <ol className="relative space-y-0">
        {labels.map((label, i) => {
          const done = i < stepIndex;
          const current = i === stepIndex;
          const last = i === labels.length - 1;
          return (
            <li key={label} className="relative flex gap-5">
              {!last ? (
                <span
                  className={[
                    "absolute left-4 top-8 bottom-0 w-0.5 -translate-x-1/2",
                    done ? "bg-[#00246a]" : "bg-[#e0e3e5]",
                  ].join(" ")}
                  aria-hidden
                />
              ) : null}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    done
                      ? "bg-[#00246a] text-white"
                      : current
                        ? "bg-[#dbe1ff] text-[#00246a]"
                        : "border-2 border-[#e0e3e5] bg-transparent text-[#757682]",
                  ].join(" ")}
                >
                  {done ? "✓" : i + 1}
                </span>
              </div>
              <div className={last ? "pb-0" : "pb-8"}>
                <p
                  className={[
                    "font-[family-name:var(--font-headline)] text-sm font-bold",
                    done || current ? "text-[#191c1e]" : "text-[#757682]",
                  ].join(" ")}
                >
                  {label}
                </p>
                {current ? (
                  <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#e0e3e5]">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-[#00246a]/80" />
                  </div>
                ) : null}
              </div>
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
  const [viewerTargetPage, setViewerTargetPage] = useState<number | null>(null);
  const [viewerHighlight, setViewerHighlight] = useState<{ page: number; quote: string } | null>(null);

  const resetIntakeUi = () => {
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
    setViewerTargetPage(null);
    setViewerHighlight(null);
  };

  const runLeaseAnalysis = useCallback(async () => {
    if (!intake) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUploadReceipt(null);
      setViewerTargetPage(null);
      setViewerHighlight(null);

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
      <div className="mx-auto w-full max-w-6xl px-4 font-sans">
        <main
          className={[
            "bys-float-shadow flex min-w-0 flex-col gap-6 rounded-[2rem] bg-[#ffffff] p-5 sm:p-8",
            uploadReceipt ? "" : "max-w-3xl mx-auto",
          ].join(" ")}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757682]">Lease review</p>
              <h1 className="mt-1 font-[family-name:var(--font-headline)] text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Lease intake
              </h1>
            </div>
            {isSubmitting ? (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#003ea8]">
                Analysis in progress
              </span>
            ) : null}
          </div>

          {intake.kind === "upload" ? (
            <p className="text-sm text-[#444651]">
              Upload received: <span className="font-semibold text-[#191c1e]">{intake.file.name}</span>
            </p>
          ) : null}
          {intake.kind === "sample" ? (
            <p className="text-sm text-[#444651]">
              Sample loaded: <span className="font-semibold text-[#191c1e]">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}
          {intake.kind === "paste" ? (
            <p className="text-sm text-[#444651]">
              Pasted text loaded:{" "}
              <span className="font-semibold text-[#191c1e]">{intake.text.length.toLocaleString()} chars</span>
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-[#c5c5d3]/35 bg-[#f2f4f6] text-[#191c1e] hover:bg-[#eceef0]"
              onClick={() => {
                resetIntakeUi();
                setIntake(null);
              }}
            >
              Back to landing
            </Button>
            <Button
              className="h-11 rounded-xl bys-gradient-cta px-6 text-white shadow-sm hover:opacity-95"
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

          {isSubmitting ? (
            <AnalysisProgressSteps key={intake.kind} variant={intake.kind === "upload" ? "upload" : "text"} />
          ) : null}

          {uploadReceipt ? (
            <div className="mt-2 flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
              {uploadReceipt.extractedPages && uploadReceipt.extractedPages.length > 0 ? (
                <div className="w-full min-w-0 lg:sticky lg:top-32 lg:w-[46%] lg:max-w-[46%] lg:shrink-0">
                  <LeaseTextViewer
                    pages={uploadReceipt.extractedPages}
                    scrollToPage={viewerTargetPage}
                    highlight={viewerHighlight}
                    fileLabel={uploadReceipt.fileName}
                    extractedFromPdf={
                      Boolean(uploadReceipt.contentType?.toLowerCase().includes("pdf")) ||
                      /\.pdf$/i.test(uploadReceipt.fileName)
                    }
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-6">
                <details className="group rounded-xl bg-[#f2f4f6] p-4 text-sm text-[#444651]">
                  <summary className="cursor-pointer font-[family-name:var(--font-headline)] text-xs font-bold uppercase tracking-[0.14em] text-[#757682]">
                    Technical details
                  </summary>
                  <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    <p>
                      Received <span className="font-medium text-[#191c1e]">{uploadReceipt.fileName}</span> (
                      {uploadReceipt.fileSizeBytes.toLocaleString()} bytes)
                      {uploadReceipt.contentType ? ` · ${uploadReceipt.contentType}` : null}
                    </p>
                    {uploadReceipt.extractedPages?.length ? (
                      <p>
                        Extracted {uploadReceipt.extractedPages.length} page(s). First page snippet:{" "}
                        {uploadReceipt.extractedPages[0]?.text.slice(0, 200) || "—"}
                      </p>
                    ) : null}
                    {uploadReceipt.rentSnippets?.length ? (
                      <p>
                        Rent mentions: {uploadReceipt.rentSnippets.length}. Example (p. {uploadReceipt.rentSnippets[0]?.page}
                        ): <span className="font-medium">{uploadReceipt.rentSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.depositSnippets?.length ? (
                      <p>
                        Deposit mentions: {uploadReceipt.depositSnippets.length}. Example (p.{" "}
                        {uploadReceipt.depositSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.depositSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.feeSnippets?.length ? (
                      <p>
                        Fee mentions: {uploadReceipt.feeSnippets.length}. Example (p. {uploadReceipt.feeSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.feeSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.noticeSnippets?.length ? (
                      <p>
                        Notice language: {uploadReceipt.noticeSnippets.length}. Example (p.{" "}
                        {uploadReceipt.noticeSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.noticeSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.renewalSnippets?.length ? (
                      <p>
                        Renewal language: {uploadReceipt.renewalSnippets.length}. Example (p.{" "}
                        {uploadReceipt.renewalSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.renewalSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.maintenanceSnippets?.length ? (
                      <p>
                        Maintenance language: {uploadReceipt.maintenanceSnippets.length}. Example (p.{" "}
                        {uploadReceipt.maintenanceSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.maintenanceSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.utilitiesSnippets?.length ? (
                      <p>
                        Utilities language: {uploadReceipt.utilitiesSnippets.length}. Example (p.{" "}
                        {uploadReceipt.utilitiesSnippets[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.utilitiesSnippets[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.ruleBasedFindings?.length ? (
                      <p>
                        Rule-based findings: {uploadReceipt.ruleBasedFindings.length}. First:{" "}
                        <span className="font-medium">
                          [{uploadReceipt.ruleBasedFindings[0]?.category}] p.{uploadReceipt.ruleBasedFindings[0]?.page}:{" "}
                          {uploadReceipt.ruleBasedFindings[0]?.quote.slice(0, 120)}
                          {uploadReceipt.ruleBasedFindings[0] && uploadReceipt.ruleBasedFindings[0].quote.length > 120
                            ? "…"
                            : ""}
                        </span>
                      </p>
                    ) : null}
                    {uploadReceipt.unclearLeasePhrases?.length ? (
                      <p className="text-[#9a3412]">
                        Possibly unclear wording: {uploadReceipt.unclearLeasePhrases.length}. Example (p.{" "}
                        {uploadReceipt.unclearLeasePhrases[0]?.page}):{" "}
                        <span className="font-medium">{uploadReceipt.unclearLeasePhrases[0]?.quote}</span>
                      </p>
                    ) : null}
                    {uploadReceipt.deterministicRiskBand !== undefined ? (
                      <div className="rounded-lg bg-[#ffffff] p-3 text-[#191c1e]">
                        <p className="font-semibold">
                          Rule-based risk (not legal advice):{" "}
                          <span className="uppercase">{uploadReceipt.deterministicRiskBand}</span> (score{" "}
                          {uploadReceipt.deterministicRiskScore ?? "—"})
                        </p>
                        {uploadReceipt.deterministicRiskReasons?.length ? (
                          <ul className="mt-1 list-inside list-disc text-[#444651]">
                            {uploadReceipt.deterministicRiskReasons.map((r, i) => (
                              <li key={`${i}-${r}`}>{r}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-[#444651]">No strong risk signals from rule scan.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </details>

                {uploadReceipt.reportError ? (
                  <div className="rounded-xl bg-[#fff7ed] p-4 text-sm text-[#9a3412]">{uploadReceipt.reportError}</div>
                ) : null}
                {uploadReceipt.report ? (
                  <LeaseReportView
                    report={uploadReceipt.report}
                    onFlagEvidenceClick={(page, quote) => {
                      setViewerTargetPage(page);
                      setViewerHighlight({ page, quote });
                    }}
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-2 rounded-xl border border-[#fecaca] bg-[#fff1f2] p-4 text-sm text-[#991b1b]">
              <h2 className="font-[family-name:var(--font-headline)] text-base font-bold text-[#7f1d1d]">
                We couldn&apos;t finish analysis
              </h2>
              <p className="mt-2 leading-relaxed">{errorMessage}</p>
              <p className="mt-2 text-xs text-[#b91c1c]">
                Your lease text was not changed. You can retry, go back to pick a different file, or paste the text
                instead.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  className="h-11 rounded-xl bys-gradient-cta text-white"
                  disabled={isSubmitting}
                  onClick={() => void runLeaseAnalysis()}
                >
                  Try again
                </Button>
                {intake.kind === "upload" ? (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-[#fecaca] bg-white hover:bg-[#fff7f7]"
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
    <div className="mx-auto w-full max-w-7xl px-4 font-sans">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-10 lg:col-span-7">
          <div className="space-y-6">
            <h1 className="font-[family-name:var(--font-headline)] text-4xl font-extrabold leading-[1.1] tracking-tight text-[#191c1e] sm:text-5xl lg:text-6xl">
              Understand your lease{" "}
              <span className="text-[#00246a]">before you sign</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#444651]">
              Upload or paste your residential lease to see key terms, fees, and risks in plain English.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { t: "Rent & Fees", d: "Rent, deposits, and recurring charges called out clearly." },
              { t: "Red Flags", d: "Clauses that look unusually tenant-unfriendly or vague." },
              { t: "Renewal & Notice", d: "End dates, renewal windows, and notice requirements." },
              { t: "Questions", d: "Negotiation prompts you can bring to the landlord or agent." },
            ].map((c) => (
              <div
                key={c.t}
                className="flex flex-col gap-2 rounded-2xl bg-[#f2f4f6] p-5 shadow-sm transition-colors hover:bg-[#ffffff]"
              >
                <div className="font-[family-name:var(--font-headline)] text-base font-bold text-[#191c1e]">{c.t}</div>
                <p className="text-xs leading-snug text-[#505f76]">{c.d}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-[#757682]">
            <span aria-hidden>
              ⓘ
            </span>
            For informational purposes only. Not legal advice.
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bys-glass-panel space-y-8 rounded-[2rem] border border-white/50 p-6 shadow-[0px_32px_64px_rgba(0,36,106,0.08)] sm:p-8 lg:sticky lg:top-32">
            <div className="space-y-1 text-center lg:text-left">
              <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-[#191c1e]">
                Start your analysis
              </h2>
              <p className="text-sm text-[#444651]">Upload a PDF lease or use a sample / pasted text</p>
            </div>

            <UploadLeaseCta
              onStartUpload={(file) => {
                resetIntakeUi();
                setIntake({ kind: "upload", file });
              }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
