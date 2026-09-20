"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LeaseTextViewer } from "@/components/beforeyousign/lease-text-viewer";
import { LeaseReportView } from "@/components/beforeyousign/lease-report";
import { parseBeforeYouSignReportJson, type BeforeYouSignReport } from "@/lib/analysis/schema";
import type { EvidenceNavigationTarget } from "@/lib/analysis/api-schema";
import type { AnalysisSuccessResponse } from "@/lib/analysis/pipeline/types";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import {
  ANALYSIS_MIN_DISPLAY_MS,
  AnalysisInProgressView,
} from "@/components/beforeyousign/analysis-in-progress";
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
import { ReportDownloadButton } from "@/components/beforeyousign/report-download-button";
import { ChecklistDownloadButton } from "@/components/beforeyousign/checklist-download-button";

type IntakeState =
  | { kind: "upload"; file: File }
  | { kind: "sample"; text: string }
  | { kind: "paste"; text: string };

const ANALYSIS_REQUEST_TIMEOUT_MS = 55_000;

async function fetchAnalysis(
  input: RequestInfo | URL,
  init: RequestInit,
  externalSignal: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromExternal = () => controller.abort();
  externalSignal.addEventListener("abort", abortFromExternal, { once: true });
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ANALYSIS_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new Error("Analysis took too long to finish. Please retry or paste the lease text instead.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal.removeEventListener("abort", abortFromExternal);
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
  const [viewerHighlight, setViewerHighlight] = useState<EvidenceNavigationTarget | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [leaseTextPanelExpanded, setLeaseTextPanelExpanded] = useState(true);
  const [intakeTab, setIntakeTab] = useState<"upload" | "paste" | "sample">("upload");
  const [stateCode, setStateCode] = useState<StateCode>("TX");
  const [stateConfirmed, setStateConfirmed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const activeAnalysisControllerRef = useRef<AbortController | null>(null);
  const analysisRequestIdRef = useRef(0);
  const completionHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const errorHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);

  const scrollToIntake = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("review-intake")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const handleGoHome = () => {
      activeAnalysisControllerRef.current?.abort();
      activeAnalysisControllerRef.current = null;
      analysisRequestIdRef.current += 1;
      setUploadReceipt(null);
      setIsSubmitting(false);
      setErrorMessage(null);
      setViewerHighlight(null);
      setSelectedFindingId(null);
      setLeaseTextPanelExpanded(true);
      setIntake(null);
      setIntakeTab("upload");
      setStateCode("TX");
      setStateConfirmed(false);
      setStatusMessage(null);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    };

    window.addEventListener("bys:go-home", handleGoHome);
    return () => window.removeEventListener("bys:go-home", handleGoHome);
  }, []);

  useEffect(() => {
    return () => activeAnalysisControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!uploadReceipt) return;
    const frame = window.requestAnimationFrame(() => completionHeadingRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [uploadReceipt]);

  useEffect(() => {
    if (!errorMessage) return;
    const frame = window.requestAnimationFrame(() => errorHeadingRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [errorMessage]);

  useEffect(() => {
    if (statusMessage !== "Analysis canceled. Your lease is still ready to review.") return;
    const frame = window.requestAnimationFrame(() => continueButtonRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [statusMessage]);

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
    activeAnalysisControllerRef.current?.abort();
    activeAnalysisControllerRef.current = null;
    analysisRequestIdRef.current += 1;
    setUploadReceipt(null);
    setIsSubmitting(false);
    setErrorMessage(null);
    setViewerHighlight(null);
    setSelectedFindingId(null);
    setLeaseTextPanelExpanded(true);
    setStateConfirmed(false);
    setStatusMessage(null);
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
    setLeaseTextPanelExpanded(window.matchMedia("(min-width: 1280px)").matches);
    setStatusMessage(null);
  }, []);

  const runLeaseAnalysis = useCallback(async () => {
    if (!intake) return;
    if (!stateConfirmed) {
      setErrorMessage(`Confirm that this is a residential lease for a property in ${getStateName(stateCode)}.`);
      return;
    }
    const requestController = new AbortController();
    activeAnalysisControllerRef.current?.abort();
    activeAnalysisControllerRef.current = requestController;
    const requestId = analysisRequestIdRef.current + 1;
    analysisRequestIdRef.current = requestId;
    const analysisStartedAt = window.performance.now();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setUploadReceipt(null);
      setViewerHighlight(null);
      setSelectedFindingId(null);
      setStatusMessage(null);

      let res: Response;
      if (intake.kind === "upload") {
        const formData = new FormData();
        formData.append("file", intake.file, intake.file.name);
        formData.append("stateCode", stateCode);
        res = await fetchAnalysis("/api/analyze", {
          method: "POST",
          body: formData,
        }, requestController.signal);
      } else {
        res = await fetchAnalysis("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leaseText: intake.text,
            fileName: intake.kind === "sample" ? "sample-lease.txt" : "pasted-lease.txt",
            stateCode,
          }),
        }, requestController.signal);
      }

      if (requestId !== analysisRequestIdRef.current) return;

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

      if (requestId !== analysisRequestIdRef.current) return;
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const remainingDisplayTime = ANALYSIS_MIN_DISPLAY_MS - (window.performance.now() - analysisStartedAt);
        if (remainingDisplayTime > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDisplayTime));
        }
      }
      if (requestId !== analysisRequestIdRef.current) return;
      applyAnalysisResponse(data);
    } catch (e) {
      if (requestController.signal.aborted || requestId !== analysisRequestIdRef.current) return;
      setErrorMessage(e instanceof Error ? e.message : "Failed to run analysis on the server.");
    } finally {
      if (requestId === analysisRequestIdRef.current) {
        activeAnalysisControllerRef.current = null;
        setIsSubmitting(false);
      }
    }
  }, [intake, applyAnalysisResponse, stateCode, stateConfirmed]);

  const cancelAnalysis = useCallback(() => {
    activeAnalysisControllerRef.current?.abort();
    activeAnalysisControllerRef.current = null;
    analysisRequestIdRef.current += 1;
    setIsSubmitting(false);
    setErrorMessage(null);
    setStatusMessage("Analysis canceled. Your lease is still ready to review.");
  }, []);

  if (intake && isSubmitting) {
    return <AnalysisInProgressView intake={intake} onCancel={cancelAnalysis} />;
  }

  if (intake && uploadReceipt) {
    const completedStateCode = uploadReceipt.stateCode ?? stateCode;
    const isPdf =
      Boolean(uploadReceipt.contentType?.toLowerCase().includes("pdf")) || /\.pdf$/i.test(uploadReceipt.fileName);
    const extractedCharCount =
      uploadReceipt.document?.extraction.totalChars ??
      uploadReceipt.extractedPages?.reduce((total, page) => total + page.text.length, 0) ??
      0;
    const coverageStatus = uploadReceipt.document?.extraction.coverageStatus;
    const showLowExtractionNote =
      (isPdf && extractedCharCount > 0 && extractedCharCount < 400) ||
      coverageStatus === "partial" ||
      coverageStatus === "unreadable";
    const reviewSteps =
      uploadReceipt.report?.nextSteps.slice(0, 3).filter(Boolean) ?? [];
    const fallbackReviewSteps = [
      "Review the terms marked for attention and compare them with the lease wording.",
      "Ask the report questions and request written clarification before signing.",
      "Save your report and consult a tenant resource or attorney if an important term remains unclear.",
    ];
    const displayedReviewSteps = reviewSteps.length > 0 ? reviewSteps : fallbackReviewSteps;
    const reviewAnotherLease = () => {
      if (!window.confirm("Start another review? This in-memory report will be cleared.")) return;
      resetIntakeUi();
      setIntake(null);
    };

    return (
      <div className="mx-auto w-full max-w-[88rem] px-4 font-sans">
        <section
          aria-labelledby="completed-review-heading"
          className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-8"
        >
          <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
            <div>
              <p className="inline-flex rounded-full bg-success-surface px-3 py-1 text-xs font-semibold text-success">
                Analysis complete
              </p>
              <h1
                ref={completionHeadingRef}
                id="completed-review-heading"
                tabIndex={-1}
                className="mt-1 w-fit rounded-sm font-[family-name:var(--font-headline)] text-3xl font-extrabold tracking-[-0.03em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:text-4xl"
              >
                Your lease review
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-relaxed text-muted-foreground sm:block">
                Start with the report, then open the source text when you want to verify a specific finding.
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden h-11 shrink-0 rounded-xl border-border bg-card text-foreground hover:bg-muted sm:inline-flex"
              onClick={reviewAnotherLease}
            >
              Review another lease
            </Button>
          </header>

          <dl className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-2 border-y border-border bg-muted/55 px-3 py-3 text-xs sm:px-4">
            <div className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Document</dt>
              <dd className="mt-0.5 truncate font-semibold text-foreground">{uploadReceipt.fileName}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rental property</dt>
              <dd className="mt-0.5 truncate font-semibold text-foreground">{getStateName(completedStateCode)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Source</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {uploadReceipt.extractedPages?.length ?? 0} page{uploadReceipt.extractedPages?.length === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>

          {showLowExtractionNote ? (
            <p className="mt-4 rounded-lg border border-warning/35 bg-warning-surface px-4 py-3 text-sm leading-relaxed text-warning">
              {OCR_WARNING}
            </p>
          ) : null}

          <div className="mt-5 grid min-w-0 gap-6 sm:mt-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(30rem,1fr)] xl:items-start xl:gap-6">
            <div className="min-w-0">
              {uploadReceipt.reportError ? (
                <div className="rounded-xl bg-warning-surface p-4 text-sm text-warning">{uploadReceipt.reportError}</div>
              ) : null}
              {uploadReceipt.report ? (
                <LeaseReportView
                  report={uploadReceipt.report}
                  texasRenterFindings={uploadReceipt.texasRenterFindings ?? []}
                  stateCode={completedStateCode}
                  stateGuidance={uploadReceipt.stateGuidance}
                  selectedFindingId={selectedFindingId}
                  evidenceSourceLabel={
                    intake.kind === "sample" ? "sample lease" : intake.kind === "paste" ? "pasted text" : undefined
                  }
                  onOpenEvidence={(target) => {
                    setSelectedFindingId(target.findingId ?? null);
                    setViewerHighlight(target);
                    setLeaseTextPanelExpanded(true);
                  }}
                />
              ) : null}

            </div>

            {uploadReceipt.extractedPages && uploadReceipt.extractedPages.length > 0 ? (
              <div className="min-w-0 xl:sticky xl:top-28">
                <LeaseTextViewer
                  pages={uploadReceipt.extractedPages}
                  highlight={viewerHighlight}
                  evidenceLinked={Boolean(viewerHighlight)}
                  evidenceIndex={uploadReceipt.evidenceIndex}
                  fileLabel={uploadReceipt.fileName}
                  textPanelExpanded={leaseTextPanelExpanded}
                  onTextPanelExpandedChange={setLeaseTextPanelExpanded}
                  returnToFindingLabel={viewerHighlight?.originLabel}
                  onReturnToFinding={
                    viewerHighlight
                      ? () => document.getElementById(viewerHighlight.returnFocusId)?.focus({ preventScroll: false })
                      : null
                  }
                  extractedFromPdf={isPdf}
                />
              </div>
            ) : null}
          </div>

          {uploadReceipt.report ? (
            <section
              aria-labelledby="review-ready-heading"
              className="mt-8 rounded-xl border border-primary/25 bg-primary px-5 py-6 text-primary-foreground sm:px-7 sm:py-7 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10"
            >
              <div>
                <h2 id="review-ready-heading" className="font-[family-name:var(--font-headline)] text-2xl font-bold">
                  Review ready
                </h2>
                <ol className="mt-4 grid gap-3 md:grid-cols-3">
                  {displayedReviewSteps.map((step, index) => (
                    <li key={`${index}-${step.slice(0, 24)}`} className="flex gap-3 text-sm leading-relaxed text-primary-foreground/90">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 text-xs font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 border-t border-primary-foreground/25 pt-5 lg:mt-0 lg:flex-col lg:border-t-0 lg:pt-0">
                <ReportDownloadButton
                  report={uploadReceipt.report}
                  texasRenterFindings={uploadReceipt.texasRenterFindings ?? []}
                  stateCode={completedStateCode}
                  stateGuidance={uploadReceipt.stateGuidance}
                  fileName={uploadReceipt.fileName}
                  mode={uploadReceipt.mode}
                  deterministicRiskBand={uploadReceipt.deterministicRiskBand}
                  deterministicRiskReasons={uploadReceipt.deterministicRiskReasons}
                />
                <ChecklistDownloadButton
                  report={uploadReceipt.report}
                  texasRenterFindings={uploadReceipt.texasRenterFindings ?? []}
                  stateCode={completedStateCode}
                  stateGuidance={uploadReceipt.stateGuidance}
                  fileName={uploadReceipt.fileName}
                />
              </div>
            </section>
          ) : null}

          <div className="mt-8 space-y-4 border-t border-border pt-6">
            <TechnicalDetailsPanel receipt={uploadReceipt} />
            <div className="rounded-lg border border-border/35 bg-secondary px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
              {(uploadReceipt.stateGuidance ?? getStateGuidanceStatus(completedStateCode)) === "supported"
                ? `${getStateName(completedStateCode)} renter guidance is included using the supported statewide reference set. City rules are not checked.`
                : `State-specific renter guidance is not currently available for ${getStateName(completedStateCode)}. This report contains general lease review only.`}
            </div>
            <LocalLawBanner />
            {uploadReceipt.report ? <FixedReportDisclaimer report={uploadReceipt.report} /> : null}
            <Button
              variant="outline"
              className="h-11 w-full rounded-xl border-border bg-card text-foreground hover:bg-muted sm:hidden"
              onClick={reviewAnotherLease}
            >
              Review another lease
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (intake) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 font-sans">
        <section
          aria-labelledby="lease-intake-heading"
          className="bys-float-shadow flex min-w-0 flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:p-8"
        >
          <h1 id="lease-intake-heading" className="font-[family-name:var(--font-headline)] text-2xl font-extrabold tracking-tight text-foreground">
            Confirm your lease
          </h1>

          <IntakeDocumentPreview intake={intake} />

          <div className="rounded-xl border border-border/45 bg-secondary p-4">
            <div className="flex items-start gap-3">
              <input
                id="state-lease-confirmation"
                type="checkbox"
                checked={stateConfirmed}
                onChange={(event) => {
                  setStateConfirmed(event.target.checked);
                  if (event.target.checked) setErrorMessage(null);
                }}
                className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
              />
              <label htmlFor="state-lease-confirmation" className="text-sm leading-relaxed text-muted-foreground">
                I confirm this is a residential lease for a property in {getStateName(stateCode)}. State-specific
                renter references are shown only when available for the selected state.
              </label>
            </div>
          </div>

          {statusMessage ? (
            <p role="status" aria-live="polite" className="rounded-lg bg-success-surface px-4 py-3 text-sm font-medium text-success">
              {statusMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-border/35 bg-muted text-foreground hover:bg-muted"
              onClick={() => {
                resetIntakeUi();
                setIntake(null);
              }}
            >
              Back to landing
            </Button>
            <Button
              ref={continueButtonRef}
              className="h-11 rounded-xl bys-gradient-cta px-6 text-primary-foreground shadow-sm hover:opacity-95"
              onClick={() => void runLeaseAnalysis()}
              disabled={isSubmitting || !stateConfirmed}
            >
              Continue to analysis
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive-surface p-4 text-sm text-destructive">
              <h2
                ref={errorHeadingRef}
                tabIndex={-1}
                className="font-[family-name:var(--font-headline)] text-base font-bold text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
              >
                We couldn&apos;t finish analysis
              </h2>
              <p className="mt-2 leading-relaxed">{errorMessage}</p>
              <p className="mt-2 text-xs text-destructive">
                Your lease text was not changed. You can retry, go back to pick a different file, or paste the text instead.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button className="h-11 rounded-xl bys-gradient-cta text-primary-foreground" onClick={() => void runLeaseAnalysis()}>
                  Try again
                </Button>
                {intake.kind === "upload" ? (
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-destructive/30 bg-card hover:bg-destructive-surface"
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
        </section>
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
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
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
