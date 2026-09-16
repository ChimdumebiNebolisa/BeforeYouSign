import type { BeforeYouSignReport, EvidenceRef, FindingCategory } from "@/lib/analysis/schema";
import { MAX_AGENDA_ITEMS, type AgendaCategory, type AgendaItem, type AgendaSnapshot, type DocumentSnapshot } from "@/lib/practice/contracts";

const PRIORITY: Record<AgendaCategory, number> = { fees: 0, notice: 1, renewal: 2, utilities: 3, maintenance: 4, other: 5 };

function categoryForQuestion(question: string): AgendaCategory {
  const value = question.toLowerCase();
  if (/utilit|water|electric|gas|internet|trash/.test(value)) return "utilities";
  if (/fee|charge|deposit|refund|rent|cost|payment/.test(value)) return "fees";
  if (/notice|day|renew|terminate|move.?out/.test(value)) return value.includes("renew") ? "renewal" : "notice";
  if (/maint|repair|responsib|clean/.test(value)) return "maintenance";
  return "other";
}

function expectedAnswerFor(category: AgendaCategory, question: string): AgendaItem["expectedAnswer"] {
  if (category === "fees") return "mixed";
  if (category === "notice" || category === "renewal") return "date_or_days";
  if (category === "utilities" || category === "maintenance") return "responsibility";
  return /how much|amount|fee|charge|rent/i.test(question) ? "amount" : "condition";
}

function refsForQuestion(report: BeforeYouSignReport, question: string): EvidenceRef[] {
  const value = question.toLowerCase();
  const refs: EvidenceRef[] = [];
  const add = (items: EvidenceRef[] | undefined) => {
    for (const item of items ?? []) if (!refs.some((ref) => ref.page === item.page && ref.quote === item.quote)) refs.push(item);
  };
  if (/fee|charge|deposit|rent|cost|payment|refund/.test(value)) {
    for (const row of report.moneyAndFees) if (value.split(/\W+/).some((token) => token.length > 3 && row.label.toLowerCase().includes(token))) add(row.evidence);
  }
  if (/notice|renew|day|terminate|move/.test(value)) for (const row of report.deadlinesAndNotice) add(row.evidence);
  if (/utilit|water|electric|gas|internet|trash/.test(value)) for (const finding of report.potentialRedFlags) if (finding.category === "utilities") add(finding.evidence);
  if (/maint|repair|responsib|clean/.test(value)) for (const finding of report.potentialRedFlags) if (finding.category === "maintenance") add(finding.evidence);
  if (!refs.length) {
    const matchingFinding = report.potentialRedFlags.find((finding) => categoryForQuestion(question) === mapFindingCategory(finding.category));
    add(matchingFinding?.evidence);
  }
  return refs.filter((ref) => ref.supportStatus !== "unsupported").slice(0, 3);
}

function mapFindingCategory(category: FindingCategory): AgendaCategory {
  if (category === "fees") return "fees";
  if (category === "notice") return "notice";
  if (category === "renewal") return "renewal";
  if (category === "utilities") return "utilities";
  if (category === "maintenance") return "maintenance";
  return "other";
}

export function buildAgendaFromReport(input: { report: BeforeYouSignReport; document: DocumentSnapshot; pagesAvailable?: boolean }): AgendaSnapshot {
  const questions = input.report.questionsToAsk.map((question, index) => {
    const category = categoryForQuestion(question);
    const sourceRefs = refsForQuestion(input.report, question);
    return {
      id: `agenda-${input.document.documentId.slice(0, 10)}-${index + 1}`,
      category,
      question,
      why: sourceRefs.length ? "This question is tied to an analyzed lease passage that needs a factual clarification." : input.pagesAvailable === false ? "No supporting passage was available from the analyzed text; treat the answer as a new clarification." : "No supporting passage was identified in the analyzed text.",
      expectedAnswer: expectedAnswerFor(category, question),
      sourceRefs,
      sourceLabel: "generated" as const,
    } satisfies AgendaItem;
  });
  const selected = questions.sort((a, b) => PRIORITY[a.category] - PRIORITY[b.category]).slice(0, MAX_AGENDA_ITEMS).map((item, index) => ({ ...item, id: `${item.id}-${index + 1}` }));
  return {
    kind: "agenda_snapshot",
    revisionId: `${input.document.documentId}-agenda-1`,
    document: input.document,
    items: selected,
    sharedContext: [input.report.summary, ...input.report.missingOrUnclear.slice(0, 3)].filter(Boolean).join("\n"),
    origin: "lease_report",
    approval: null,
  };
}

export function createAgendaRevision(agenda: AgendaSnapshot, items: AgendaItem[], origin: AgendaSnapshot["origin"] = "practice_revision"): AgendaSnapshot {
  return { ...agenda, revisionId: `${agenda.revisionId}-r${Date.now()}`, items: items.slice(0, MAX_AGENDA_ITEMS), origin, approval: null };
}
