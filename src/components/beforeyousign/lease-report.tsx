"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { EvidenceNavigationTarget } from "@/lib/analysis/api-schema";
import {
  clampForScan,
  DeadlinesSection,
  displayRiskContext,
  displaySummaryIntro,
  type EvidenceSourceLabel,
  INITIAL_QUESTIONS,
  MAX_AGREE_BULLETS,
  MissingSection,
  MoneySection,
  QuestionsSection,
  RedFlagsSection,
  ResponsibilitiesSection,
  SCAN_LINE_CHARS,
  SummarySection,
  TexasRenterCheckSection,
} from "@/components/beforeyousign/lease-report-slides";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { getStateGuidanceStatus, getStateName, type StateCode, type StateGuidanceStatus } from "@/lib/jurisdiction/states";

type ReportSectionId =
  | "summary"
  | "terms"
  | "money"
  | "deadlines"
  | "responsibilities"
  | "questions"
  | "state-check"
  | "missing";

type ReportSection = {
  id: ReportSectionId;
  label: string;
  content: ReactNode;
};

export function LeaseReportView({
  report,
  texasRenterFindings = [],
  stateCode = "TX",
  stateGuidance = getStateGuidanceStatus(stateCode),
  onOpenEvidence,
  selectedFindingId,
  evidenceSourceLabel,
}: {
  report: BeforeYouSignReport;
  texasRenterFindings?: TexasRenterFinding[];
  stateCode?: StateCode;
  stateGuidance?: StateGuidanceStatus;
  onOpenEvidence: (target: EvidenceNavigationTarget) => void;
  selectedFindingId?: string | null;
  evidenceSourceLabel?: EvidenceSourceLabel;
}) {
  const summaryIntro = displaySummaryIntro(report.summary);
  const agreeBullets = report.whatYoureAgreeingTo
    .slice(0, MAX_AGREE_BULLETS)
    .map((line) => clampForScan(line, SCAN_LINE_CHARS));
  const riskNote = displayRiskContext(report.riskReason);

  const [expandedFlagEvidence, setExpandedFlagEvidence] = useState<Record<string, boolean>>({});
  const [expandedMoneyQuotes, setExpandedMoneyQuotes] = useState<Record<string, boolean>>({});
  const [expandedInlineEvidence, setExpandedInlineEvidence] = useState<Record<string, boolean>>({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<ReportSectionId>("summary");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const focusAfterSelectionRef = useRef(false);

  const questionsShown = useMemo(() => {
    if (report.questionsToAsk.length <= INITIAL_QUESTIONS || showAllQuestions) return report.questionsToAsk;
    return report.questionsToAsk.slice(0, INITIAL_QUESTIONS);
  }, [report.questionsToAsk, showAllQuestions]);

  const extraQuestionCount = Math.max(0, report.questionsToAsk.length - INITIAL_QUESTIONS);
  const hasStateSpecificGuidance = stateGuidance === "supported";
  const hasMissing = report.missingOrUnclear.length > 0;

  const sections: ReportSection[] = [
    {
      id: "summary",
      label: "Summary",
      content: (
        <SummarySection
          report={report}
          summaryIntro={summaryIntro}
          agreeBullets={agreeBullets}
          riskNote={riskNote}
        />
      ),
    },
    {
      id: "terms",
      label: "Terms to review",
      content: (
        <RedFlagsSection
          report={report}
          expandedFlagEvidence={expandedFlagEvidence}
          setExpandedFlagEvidence={setExpandedFlagEvidence}
          selectedFindingId={selectedFindingId}
          onOpenEvidence={onOpenEvidence}
          evidenceSourceLabel={evidenceSourceLabel}
          expandedInlineEvidence={expandedInlineEvidence}
          setExpandedInlineEvidence={setExpandedInlineEvidence}
        />
      ),
    },
    {
      id: "money",
      label: "Money and fees",
      content: (
        <MoneySection
          report={report}
          expandedMoneyQuotes={expandedMoneyQuotes}
          setExpandedMoneyQuotes={setExpandedMoneyQuotes}
          evidenceSourceLabel={evidenceSourceLabel}
          onOpenEvidence={onOpenEvidence}
          expandedInlineEvidence={expandedInlineEvidence}
          setExpandedInlineEvidence={setExpandedInlineEvidence}
        />
      ),
    },
    {
      id: "deadlines",
      label: "Deadlines and notices",
      content: (
        <DeadlinesSection
          report={report}
          evidenceSourceLabel={evidenceSourceLabel}
          onOpenEvidence={onOpenEvidence}
          expandedInlineEvidence={expandedInlineEvidence}
          setExpandedInlineEvidence={setExpandedInlineEvidence}
        />
      ),
    },
    {
      id: "responsibilities",
      label: "Responsibilities",
      content: <ResponsibilitiesSection report={report} />,
    },
    {
      id: "questions",
      label: "Questions to ask",
      content: (
        <QuestionsSection
          report={report}
          questionsShown={questionsShown}
          showAllQuestions={showAllQuestions}
          setShowAllQuestions={setShowAllQuestions}
          extraQuestionCount={extraQuestionCount}
        />
      ),
    },
  ];

  if (hasStateSpecificGuidance) {
    sections.push({
      id: "state-check",
      label: `${getStateName(stateCode)} renter check`,
      content: (
        <TexasRenterCheckSection
          findings={texasRenterFindings}
          selectedFindingId={selectedFindingId}
          onOpenEvidence={onOpenEvidence}
          evidenceSourceLabel={evidenceSourceLabel}
          expandedInlineEvidence={expandedInlineEvidence}
          setExpandedInlineEvidence={setExpandedInlineEvidence}
        />
      ),
    });
  }

  if (hasMissing) {
    sections.push({
      id: "missing",
      label: "Not clearly stated",
      content: <MissingSection report={report} />,
    });
  }

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  useEffect(() => {
    if (!focusAfterSelectionRef.current) return;
    focusAfterSelectionRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      const heading = panelRef.current?.querySelector<HTMLElement>("h2, h3");
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSectionId]);

  const selectSection = (id: ReportSectionId) => {
    if (id === activeSectionId) return;
    focusAfterSelectionRef.current = true;
    setActiveSectionId(id);
  };

  return (
    <section className="space-y-3 sm:space-y-4" aria-label="Lease analysis report" data-report-section={activeSection.id}>
      <div className="lg:hidden">
        <label htmlFor="report-section-select" className="text-sm font-semibold text-foreground">
          Report section
        </label>
        <select
          id="report-section-select"
          value={activeSection.id}
          onChange={(event) => selectSection(event.target.value as ReportSectionId)}
          className="mt-2 min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[10.5rem_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="Report sections">
          <ol className="space-y-1 border-r border-border/40 pr-4">
            {sections.map((section, index) => {
              const selected = section.id === activeSection.id;
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    className={[
                      "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      selected
                        ? "bg-accent text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")}
                    onClick={() => selectSection(section.id)}
                  >
                    <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                    <span>{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div ref={panelRef} className="min-w-0" data-active-report-panel={activeSection.id}>
          {activeSection.content}
        </div>
      </div>
    </section>
  );
}
