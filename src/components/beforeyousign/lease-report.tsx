"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import {
  clampForScan,
  DeadlinesSection,
  displayRiskContext,
  displaySummaryIntro,
  INITIAL_QUESTIONS,
  MAX_AGREE_BULLETS,
  MissingSection,
  MoneySection,
  NextStepsSection,
  QuestionsSection,
  RedFlagsSection,
  ResponsibilitiesSection,
  SCAN_LINE_CHARS,
  SummarySection,
} from "@/components/beforeyousign/lease-report-slides";

const RED_FLAGS_SLIDE_INDEX = 1;

const SLIDE_LABELS_BASE = [
  "Summary",
  "Potential red flags",
  "Money and fees",
  "Deadlines and notices",
  "Responsibilities",
  "Questions to ask",
  "Next steps",
] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function LeaseReportCarousel({
  report,
  summaryIntro,
  agreeBullets,
  riskNote,
  expandedFlagEvidence,
  setExpandedFlagEvidence,
  expandedMoneyQuotes,
  setExpandedMoneyQuotes,
  questionsShown,
  showAllQuestions,
  setShowAllQuestions,
  extraQuestionCount,
  selectedFindingId,
  onFlagEvidenceClick,
}: {
  report: BeforeYouSignReport;
  summaryIntro: string;
  agreeBullets: string[];
  riskNote: string;
  expandedFlagEvidence: Record<string, boolean>;
  setExpandedFlagEvidence: Dispatch<SetStateAction<Record<string, boolean>>>;
  expandedMoneyQuotes: Record<string, boolean>;
  setExpandedMoneyQuotes: Dispatch<SetStateAction<Record<string, boolean>>>;
  questionsShown: string[];
  showAllQuestions: boolean;
  setShowAllQuestions: Dispatch<SetStateAction<boolean>>;
  extraQuestionCount: number;
  selectedFindingId?: string | null;
  onFlagEvidenceClick: (args: { page: number; quote: string; findingId: string }) => void;
}) {
  const hasMissing = report.missingOrUnclear.length > 0;
  const slideLabels = useMemo(
    () => (hasMissing ? [...SLIDE_LABELS_BASE, "Not clearly stated"] : [...SLIDE_LABELS_BASE]),
    [hasMissing],
  );
  const slideCount = slideLabels.length;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const sync = (api: NonNullable<typeof emblaApi>) => setSelectedIndex(api.selectedScrollSnap());
    emblaApi.on("init", sync);
    emblaApi.on("reInit", sync);
    emblaApi.on("select", sync);
    return () => {
      emblaApi.off("init", sync);
      emblaApi.off("reInit", sync);
      emblaApi.off("select", sync);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, slideCount]);

  useEffect(() => {
    if (!emblaApi || !selectedFindingId) return;
    const hit = report.potentialRedFlags.some((f) => f.id === selectedFindingId);
    if (!hit) return;
    const jump = prefersReducedMotion();
    emblaApi.scrollTo(RED_FLAGS_SLIDE_INDEX, jump);
    const id = selectedFindingId;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-finding-id="${CSS.escape(id)}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: jump ? "auto" : "smooth" });
    });
  }, [selectedFindingId, emblaApi, report.potentialRedFlags]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const goTo = useCallback(
    (i: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(i, prefersReducedMotion());
    },
    [emblaApi],
  );

  const currentLabel = slideLabels[selectedIndex] ?? slideLabels[0];
  const announce = `Section ${selectedIndex + 1} of ${slideCount}: ${currentLabel}.`;

  return (
    <section className="space-y-3" aria-label="Lease analysis report">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c5c5d3]/40 bg-[#ffffff] text-[#191c1e] shadow-sm transition hover:bg-[#f7f9fb] disabled:pointer-events-none disabled:opacity-40"
          onClick={scrollPrev}
          disabled={selectedIndex <= 0}
          aria-label="Previous section"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <p className="min-w-0 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#757682]">
          <span className="text-[#191c1e]">{selectedIndex + 1}</span>
          <span className="mx-1 text-[#c5c5d3]">/</span>
          <span>{slideCount}</span>
          <span className="mt-0.5 block font-[family-name:var(--font-headline)] text-[13px] font-semibold normal-case tracking-normal text-[#191c1e]">
            {currentLabel}
          </span>
        </p>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c5c5d3]/40 bg-[#ffffff] text-[#191c1e] shadow-sm transition hover:bg-[#f7f9fb] disabled:pointer-events-none disabled:opacity-40"
          onClick={scrollNext}
          disabled={selectedIndex >= slideCount - 1}
          aria-label="Next section"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex touch-pan-y">
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <SummarySection
                report={report}
                summaryIntro={summaryIntro}
                agreeBullets={agreeBullets}
                riskNote={riskNote}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <RedFlagsSection
                report={report}
                expandedFlagEvidence={expandedFlagEvidence}
                setExpandedFlagEvidence={setExpandedFlagEvidence}
                selectedFindingId={selectedFindingId}
                onFlagEvidenceClick={onFlagEvidenceClick}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <MoneySection
                report={report}
                expandedMoneyQuotes={expandedMoneyQuotes}
                setExpandedMoneyQuotes={setExpandedMoneyQuotes}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <DeadlinesSection report={report} />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <ResponsibilitiesSection report={report} />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <QuestionsSection
                report={report}
                questionsShown={questionsShown}
                showAllQuestions={showAllQuestions}
                setShowAllQuestions={setShowAllQuestions}
                extraQuestionCount={extraQuestionCount}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[0_0_100%] px-0.5">
            <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
              <NextStepsSection report={report} />
            </div>
          </div>
          {hasMissing ? (
            <div className="min-w-0 flex-[0_0_100%] px-0.5">
              <div className="max-h-[min(72vh,560px)] overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]">
                <MissingSection report={report} />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 px-1" aria-label="Report sections">
        {slideLabels.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={selectedIndex === i ? "true" : undefined}
            aria-label={`Go to ${label}`}
            className={[
              "h-2 rounded-full transition-[width,background-color] duration-200",
              selectedIndex === i ? "w-6 bg-[#00246a]" : "w-2 bg-[#c5c5d3]/55 hover:bg-[#c5c5d3]",
            ].join(" ")}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
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
  const agreeBullets = report.whatYoureAgreeingTo
    .slice(0, MAX_AGREE_BULLETS)
    .map((line) => clampForScan(line, SCAN_LINE_CHARS));
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

  const shared = {
    report,
    summaryIntro,
    agreeBullets,
    riskNote,
    expandedFlagEvidence,
    setExpandedFlagEvidence,
    expandedMoneyQuotes,
    setExpandedMoneyQuotes,
    questionsShown,
    showAllQuestions,
    setShowAllQuestions,
    extraQuestionCount,
    selectedFindingId,
    onFlagEvidenceClick,
  };

  return <LeaseReportCarousel {...shared} />;
}
