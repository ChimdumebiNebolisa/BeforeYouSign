import type { AgendaSnapshot } from "@/lib/practice/contracts";
import { completePracticeTurns, type PracticeTurn } from "@/lib/practice/session";

export type PracticeReviewItem = {
  questionId: string;
  gap: "not asked" | "asked but not answered" | "transcription unavailable" | "follow-up needed";
  turnIds: string[];
  rationale: string;
  followUp: string;
  origin: "practice_roleplay";
};

export type PracticeReview = { transcriptRevision: string; items: PracticeReviewItem[]; origin: "practice_roleplay" };

export function parsePracticeReview(value: unknown, agenda: AgendaSnapshot, turns: PracticeTurn[]): PracticeReview | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (!Array.isArray(source.items)) return null;
  const validTurnIds = new Set(completePracticeTurns(turns).map((turn) => turn.id));
  const items: PracticeReviewItem[] = [];
  for (const raw of source.items) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const item = raw as Record<string, unknown>;
    if (
      typeof item.questionId !== "string" ||
      !agenda.items.some((agendaItem) => agendaItem.id === item.questionId) ||
      !["not asked", "asked but not answered", "transcription unavailable", "follow-up needed"].includes(String(item.gap)) ||
      !Array.isArray(item.turnIds) ||
      item.turnIds.some((id) => typeof id !== "string" || !validTurnIds.has(id)) ||
      typeof item.rationale !== "string" ||
      typeof item.followUp !== "string" ||
      !item.followUp.trim()
    ) {
      return null;
    }
    items.push({
      questionId: item.questionId,
      gap: item.gap as PracticeReviewItem["gap"],
      turnIds: item.turnIds as string[],
      rationale: item.rationale.trim(),
      followUp: item.followUp.trim(),
      origin: "practice_roleplay",
    });
  }
  return {
    transcriptRevision: typeof source.transcriptRevision === "string" ? source.transcriptRevision : "practice-transcript",
    items,
    origin: "practice_roleplay",
  };
}

export function buildPracticeReviewPrompt(agenda: AgendaSnapshot, turns: PracticeTurn[]): string {
  const transcript = completePracticeTurns(turns).map((turn) => `${turn.speaker}: ${turn.text}`).join("\n");
  return [
    "Review this practice role-play only. It is not a real landlord statement and must not produce legal or identity judgments.",
    "For each agenda question, distinguish not asked, asked but not answered, transcription unavailable, and follow-up needed.",
    "Use only complete practice turns as support. Do not score personality, accent, fluency, legal correctness, or confidence. Return at most one concise neutral follow-up per item.",
    `Agenda:\n${agenda.items.map((item) => `${item.id}: ${item.question}`).join("\n")}`,
    `Practice transcript:\n${transcript || "No complete transcript turns are available."}`,
  ].join("\n\n");
}
