"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LeaseTextViewer } from "@/components/beforeyousign/lease-text-viewer";
import { LeaseReportView } from "@/components/beforeyousign/lease-report";
import { parseBeforeYouSignReportJson, type BeforeYouSignReport } from "@/lib/analysis/schema";
import type { EvidenceClickArgs } from "@/lib/analysis/api-schema";
import type { AnalysisSuccessResponse } from "@/lib/analysis/pipeline/types";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { AnalysisInProgressView } from "@/components/beforeyousign/analysis-in-progress";
import { IntakeDocumentPreview } from "@/components/beforeyousign/intake-document-preview";
import { TechnicalDetailsPanel } from "@/components/beforeyousign/technical-details-panel";
import { LandingHero } from "@/components/beforeyousign/landing-hero";
import { LandingIntakeCard } from "@/components/beforeyousign/landing-intake-card";
import { LandingPreviewSection } from "@/components/beforeyousign/landing-preview-section";
import { LandingHowItWorks } from "@/components/beforeyousign/landing-how-it-works";
import { LandingWhatItChecks } from "@/components/beforeyousign/landing-what-it-checks";
import { LandingLimitations } from "@/components/beforeyousign/landing-limitations";
import { LandingFaq } from "@/components/beforeyousign/landing-faq";
import { LandingFooter } from "@/components/beforeyousign/landing-footer";
import { FixedReportDisclaimer, LocalLawBanner } from "@/components/beforeyousign/lease-report-slides";
import type { EvidenceIndex } from "@/lib/evidence/index";
import { OCR_WARNING } from "@/lib/public-copy";
import { getStateGuidanceStatus, getStateName, type StateCode } from "@/lib/jurisdiction/states";

type IntakeState =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

const ANALYSIS_REQUEST_TIMEOUT_MS = 55_000;

async function fetchAnalysis(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), ANALYSIS_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Analysis took too long to finish. Please retry or paste the lease text instead.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

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
    texasRenterFindings?: TexasRenterFinding[];
    deterministicRiskScore?: number;
    deterministicRiskBand?: "low" | "medium" | "high";
    deterministicRiskReasons?: string[];
    report?: BeforeYouSignReport | null;
    reportError?: string | null;
     analysisVersion?: number;
    mode?: AnalysisSuccessResponse["mode"];
    requestId?: string;
    evidenceIndex?: EvidenceIndex;
    document?: AnalysisSuccessResponse["document"];
    stateCode?: StateCode;
    stateGuidance?: AnalysisSuccessResponse["stateGuidance"];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewerTargetPage, setViewerTargetPage] = useState<number | null>(null);
  const [viewerHighlight, setViewerHighlight] = useState<EvidenceClickArgs | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [leaseTextPanelExpanded, setLeaseTextPanelExpanded] = useState(true);
  const [intakeTab, setIntakeTab] = useState<"upload" | "paste" | "sample">("upload");
  const [stateCode, setStateCode] = useState<StateCode>("TX");
  const [stateConfirmed, setStateConfirmed] = useState(false);

  const scrollToIntake = () => {
    document.getElementById("review-intake")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const handleGoHome = () => {
      setUploadReceipt(null);
      setIsSubmitting(false);
      setErrorMessage(null);
      setViewerTargetPage(null);
      setViewerHighlight(null);
      setSelectedFindingId(null);
      setLeaseTextPanelExpanded(true);
      setIntake(null);
      setIntakeTab("upload");
      setStateCode("TX");
      setStateConfirmed(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("bys:go-home", handleGoHome);
    return () => window.removeEventListener("bys:go-home", handleGoHome);
  }, []);

  const formatAnalysisError = (raw: string, status: number): string => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return `Something went wrong (code ${status}). Try again or paste the lease text instead.`;
    }

    if (/<!doctype html|<html[\s>]/i.test(trimmed)) {
      return "A server error occurred while analyzing this lease. Please retry.";
    }

    const display = trimmed.length > 600 ? `${trimmed.slice(0, 600)}...` : trimmed;
    return `Unable to analyze this lease: ${display}`;
  };

  const resetIntakeUi = () => {
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
    setViewerTargetPage(null);
    setViewerHighlight(null);
    setSelectedFindingId(null);
    setLeaseTextPanelExpanded(true);
    setStateConfirmed(false);
  };

  const applyAnalysisResponse = useCallback((data: AnalysisSuccessResponse & {
    report?: unknown;
    reportError?: string | null;
  }) => {
    const report =
      data.report === undefined || data.report === null
        ? null
        : parseBeforeYouSignReportJson(data.report);

    setUploadReceipt({
      ...data,
      report,
      reportError: typeof data.reportError === "string" ? data.reportError : null,
    });
  }, []);

  const runLeaseAnalysis = useCallback(async () => {
    if (!intake) return;
    if (!stateConfirmed) {
      setErrorMessage(`Confirm that this is a residential lease for a property in ${getStateName(stateCode)}.`);
      return;
    }
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
        formData.append("stateCode", stateCode);
        res = await fetchAnalysis("/api/analyze", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetchAnalysis("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leaseText: intake.text,
            fileName: intake.kind === "sample" ? "sample-lease.txt" : "pasted-lease.txt",
            stateCode,
          }),
        });
      }

      if (!res.ok) {
        const text = await res.text();
        let message = formatAnalysisError(text, res.status);
        try {
          const errJson = JSON.parse(text) as { error?: unknown };
          if (typeof errJson.error === "string" && errJson.error) {
            message = errJson.error;
          } else if (
            errJson.error &&
            typeof errJson.error === "object" &&
            "message" in errJson.error &&
            typeof (errJson.error as { message: unknown }).message === "string"
          ) {
            message = (errJson.error as { message: string }).message;
          }
        } catch {
          // use raw body or status message
        }
        throw new Error(message);
      }

      const data = (await res.json()) as AnalysisSuccessResponse & { report?: unknown; reportError?: string | null };

      applyAnalysisResponse(data);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to run analysis on the server.");
    } finally {
      setIsSubmitting(false);
    }
  }, [intake, applyAnalysisResponse, stateCode, stateConfirmed]);

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

          <div className="rounded-xl border border-[#c5c5d3]/45 bg-[#f7f9fb] p-4">
            <div className="flex items-start gap-3">
              <input
                id="state-lease-confirmation"
                type="checkbox"
                checked={stateConfirmed}
                onChange={(event) => {
                  setStateConfirmed(event.target.checked);
                  if (event.target.checked) setErrorMessage(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#00246a]"
              />
              <label htmlFor="state-lease-confirmation" className="text-sm leading-relaxed text-[#444651]">
                I confirm this is a residential lease for a property in {getStateName(stateCode)}. State-specific
                renter references are shown only when available for the selected state.
              </label>
            </div>
          </div>

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
            {!uploadReceipt ? (
              <Button
                className="h-11 rounded-xl bys-gradient-cta px-6 text-white shadow-sm hover:opacity-95"
                onClick={() => void runLeaseAnalysis()}
                disabled={isSubmitting || !stateConfirmed}
              >
                {isSubmitting
                  ? intake.kind === "upload"
                    ? "Sending PDF..."
                    : "Analyzing text..."
                  : "Continue to analysis"}
              </Button>
            ) : null}
          </div>

          {uploadReceipt ? (
            <>
              {(() => {
                const isPdf =
                  Boolean(uploadReceipt.contentType?.toLowerCase().includes("pdf")) ||
                  /\.pdf$/i.test(uploadReceipt.fileName);
                const extractedCharCount =
                  uploadReceipt.document?.extraction.totalChars ??
                  uploadReceipt.extractedPages?.reduce((total, page) => total + page.text.length, 0) ??
                  0;
                const coverageStatus = uploadReceipt.document?.extraction.coverageStatus;
                const showLowExtractionNote =
                  (isPdf && extractedCharCount > 0 && extractedCharCount < 400) ||
                  coverageStatus === "partial" ||
                  coverageStatus === "unreadable";
                return showLowExtractionNote ? (
                  <p className="mt-2 rounded-lg border border-[#c5c5d3]/35 bg-[#f7f9fb] px-4 py-3 text-sm leading-relaxed text-[#444651]">
                    {OCR_WARNING}
                  </p>
                ) : null;
              })()}
            <div className="mt-2 flex min-w-0 flex-col gap-8 lg:flex-row lg:items-start">
              {uploadReceipt.extractedPages && uploadReceipt.extractedPages.length > 0 ? (
                <div className="w-full min-w-0 lg:sticky lg:top-32 lg:w-[52%] lg:max-w-[52%] lg:shrink-0">
                  <LeaseTextViewer
                    pages={uploadReceipt.extractedPages}
                    scrollToPage={viewerTargetPage}
                    highlight={viewerHighlight}
                    evidenceLinked={Boolean(viewerHighlight)}
                    evidenceIndex={uploadReceipt.evidenceIndex}
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
                {uploadReceipt.reportError ? (
                  <div className="rounded-xl bg-[#fff7ed] p-4 text-sm text-[#9a3412]">{uploadReceipt.reportError}</div>
                ) : null}
                {uploadReceipt.report ? (
                  <LeaseReportView
                    report={uploadReceipt.report}
                    texasRenterFindings={uploadReceipt.texasRenterFindings ?? []}
                    stateCode={uploadReceipt.stateCode ?? stateCode}
                    stateGuidance={uploadReceipt.stateGuidance}
                    fileName={uploadReceipt.fileName}
                    mode={uploadReceipt.mode}
                    deterministicRiskBand={uploadReceipt.deterministicRiskBand}
                    deterministicRiskReasons={uploadReceipt.deterministicRiskReasons}
                    selectedFindingId={selectedFindingId}
                    evidenceSourceLabel={
                      intake.kind === "sample" ? "sample lease" : intake.kind === "paste" ? "pasted text" : undefined
                    }
                    onFlagEvidenceClick={({ page, quote, findingId, startIndex, endIndex, evidenceId, exact }) => {
                      setSelectedFindingId(findingId ?? null);
                      setViewerTargetPage(page);
                      setViewerHighlight({
                        page,
                        quote,
                        startIndex,
                        endIndex,
                        evidenceId,
                        exact: exact ?? (startIndex !== undefined && endIndex !== undefined),
                      });
                      setLeaseTextPanelExpanded(true);
                    }}
                  />
                ) : null}
                <TechnicalDetailsPanel receipt={uploadReceipt} />
                <div className="rounded-lg border border-[#c5c5d3]/35 bg-[#f7f9fb] px-4 py-3 text-[12px] leading-relaxed text-[#444651]">
                  {((uploadReceipt.stateGuidance ?? getStateGuidanceStatus(uploadReceipt.stateCode ?? stateCode)) ===
                    "supported")
                    ? `${getStateName(uploadReceipt.stateCode ?? stateCode)} renter guidance is included using the supported statewide reference set. City rules are not checked.`
                    : `State-specific renter guidance is not currently available for ${getStateName(uploadReceipt.stateCode ?? stateCode)}. This report contains general lease review only.`}
                </div>
                <LocalLawBanner />
                {uploadReceipt.report ? <FixedReportDisclaimer report={uploadReceipt.report} /> : null}
              </div>
            </div>
            </>
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

  const startUpload = (file: File) => {
    resetIntakeUi();
    setIntake({ kind: "upload", file });
  };

  const startPaste = (text: string) => {
    resetIntakeUi();
    setIntake({ kind: "paste", text });
  };

  const startSample = (text: string) => {
    resetIntakeUi();
    setIntake({ kind: "sample", text });
  };

  return (
    <div className="bys-container w-full px-6 font-sans lg:px-8">
      <section className="pt-12 pb-[4.5rem] lg:pt-8 lg:pb-24">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-7">
            <LandingHero
              onReviewLease={scrollToIntake}
              onRunSample={() => {
                scrollToIntake();
                setIntakeTab("sample");
              }}
            />
          </div>

          <div className="flex justify-center lg:col-span-5 lg:justify-center">
            <div className="w-full max-w-[480px]">
              <LandingIntakeCard
                onStartUpload={startUpload}
                onStartPaste={startPaste}
                onStartSample={startSample}
                pasteOpenRequestVersion={pasteOpenNonce}
                activeTab={intakeTab}
                onTabChange={setIntakeTab}
                stateCode={stateCode}
                onStateChange={(nextState) => {
                  setStateCode(nextState);
                  setStateConfirmed(false);
                  setErrorMessage(null);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <LandingPreviewSection />
      <LandingHowItWorks />
      <LandingWhatItChecks />
      <LandingLimitations />
      <LandingFaq />
      <LandingFooter />
    </div>
  );
}
