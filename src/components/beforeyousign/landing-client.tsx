"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";
import { LeaseTextViewer } from "@/components/beforeyousign/lease-text-viewer";
import { LeaseReportView } from "@/components/beforeyousign/lease-report";
import { parseBeforeYouSignReportJson, type BeforeYouSignReport } from "@/lib/analysis/schema";
import { AnalysisInProgressView } from "@/components/beforeyousign/analysis-in-progress";
import { IntakeDocumentPreview } from "@/components/beforeyousign/intake-document-preview";
import { TechnicalDetailsPanel } from "@/components/beforeyousign/technical-details-panel";

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
    reportDebug?: { rawModelResponse?: string; failureStage?: string } | null;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerTargetPage, setViewerTargetPage] = useState<number | null>(null);
  const [viewerHighlight, setViewerHighlight] = useState<{ page: number; quote: string } | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [leaseTextPanelExpanded, setLeaseTextPanelExpanded] = useState(true);

  const resetIntakeUi = () => {
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
    setViewerTargetPage(null);
    setViewerHighlight(null);
    setSelectedFindingId(null);
    setLeaseTextPanelExpanded(true);
  };

  const runLeaseAnalysis = useCallback(async () => {
    if (!intake) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUploadReceipt(null);
      setViewerTargetPage(null);
      setViewerHighlight(null);
      setSelectedFindingId(null);
      setLeaseTextPanelExpanded(true);

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
        reportDebug?: { rawModelResponse?: string; failureStage?: string };
      };

      const report =
        data.report === undefined || data.report === null
          ? null
          : parseBeforeYouSignReportJson(data.report);
      setUploadReceipt({
        ...data,
        report,
        reportError: typeof data.reportError === "string" ? data.reportError : null,
        reportDebug:
          data.reportDebug && typeof data.reportDebug === "object" ? data.reportDebug : null,
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to run analysis on the server.");
    } finally {
      setIsSubmitting(false);
    }
  }, [intake]);

  if (intake && isSubmitting) {
    return <AnalysisInProgressView intake={intake} />;
  }

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
          </div>

          <IntakeDocumentPreview intake={intake} />

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

          {uploadReceipt ? (
            <div className="mt-2 flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
              {uploadReceipt.extractedPages && uploadReceipt.extractedPages.length > 0 ? (
                <div className="w-full min-w-0 lg:sticky lg:top-32 lg:w-[46%] lg:max-w-[46%] lg:shrink-0">
                  <LeaseTextViewer
                    pages={uploadReceipt.extractedPages}
                    scrollToPage={viewerTargetPage}
                    highlight={viewerHighlight}
                    evidenceLinked={Boolean(viewerHighlight)}
                    fileLabel={uploadReceipt.fileName}
                    textPanelExpanded={leaseTextPanelExpanded}
                    onTextPanelExpandedChange={setLeaseTextPanelExpanded}
                    extractedFromPdf={
                      Boolean(uploadReceipt.contentType?.toLowerCase().includes("pdf")) ||
                      /\.pdf$/i.test(uploadReceipt.fileName)
                    }
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-6">
                <TechnicalDetailsPanel receipt={uploadReceipt} />

                {uploadReceipt.reportError ? (
                  <div className="rounded-xl bg-[#fff7ed] p-4 text-sm text-[#9a3412]">{uploadReceipt.reportError}</div>
                ) : null}
                {uploadReceipt.reportDebug &&
                (uploadReceipt.reportDebug.rawModelResponse || uploadReceipt.reportDebug.failureStage) ? (
                  <details className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-3 text-xs text-[#334155]">
                    <summary className="cursor-pointer font-medium text-[#0f172a]">
                      Developer: AI response debug
                    </summary>
                    {uploadReceipt.reportDebug.failureStage ? (
                      <p className="mt-2 font-mono">stage: {uploadReceipt.reportDebug.failureStage}</p>
                    ) : null}
                    {uploadReceipt.reportDebug.rawModelResponse ? (
                      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
                        {uploadReceipt.reportDebug.rawModelResponse}
                      </pre>
                    ) : null}
                  </details>
                ) : null}
                {uploadReceipt.report ? (
                  <LeaseReportView
                    report={uploadReceipt.report}
                    selectedFindingId={selectedFindingId}
                    onFlagEvidenceClick={({ page, quote, findingId }) => {
                      setSelectedFindingId(findingId);
                      setViewerTargetPage(page);
                      setViewerHighlight({ page, quote });
                      setLeaseTextPanelExpanded(true);
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
