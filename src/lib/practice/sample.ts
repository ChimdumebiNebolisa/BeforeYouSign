import type { AgendaSnapshot } from "@/lib/practice/contracts";
import type { PracticeReview } from "@/lib/practice/review";
import type { PracticeTurn } from "@/lib/practice/session";

export type PracticeSample = { agenda: AgendaSnapshot; turns: PracticeTurn[]; review: PracticeReview };

export function samplePractice(): PracticeSample {
  const agenda: AgendaSnapshot = {
    kind: "agenda_snapshot",
    revisionId: "sample-practice-agenda-1",
    document: { documentId: "sample-practice", fileName: "fictional-lease.txt", revision: "sample-v1", extractionLimitations: [] },
    items: [
      { id: "sample-fee", category: "fees", question: "What is the administrative fee, and is any part refundable?", why: "The fictional lease states the amount but leaves refundability to clarify.", expectedAnswer: "mixed", sourceRefs: [{ page: 1, quote: "$300 administrative fee" }], sourceLabel: "generated" },
      { id: "sample-water", category: "utilities", question: "Is water included in the listed rent or billed separately?", why: "The fictional lease says water is included.", expectedAnswer: "responsibility", sourceRefs: [{ page: 1, quote: "Water is included in the monthly rent." }], sourceLabel: "generated" },
      { id: "sample-notice", category: "notice", question: "How many days of written notice are required?", why: "The fictional lease states a written notice period.", expectedAnswer: "date_or_days", sourceRefs: [{ page: 2, quote: "Sixty days written notice" }], sourceLabel: "generated" },
    ],
    sharedContext: "Fictional sample only: rent is $1,800, a $300 administrative fee appears once at signing, water is listed as included, and the written notice period is 60 days.",
    origin: "synthetic_example",
    approval: null,
  };
  const turns: PracticeTurn[] = [
    { id: "sample-turn-fee", speaker: "role_play_representative", text: "The administrative fee is $300 and is paid once at signing.", final: true },
    { id: "sample-turn-water", speaker: "role_play_representative", text: "It depends on the building's usual arrangement.", final: true },
    { id: "sample-turn-notice", speaker: "role_play_representative", text: "Thirty days is normally fine.", final: true },
    { id: "sample-turn-notice-correction", speaker: "role_play_representative", text: "For this fictional scenario, the written term is sixty days.", final: true },
  ];
  const review: PracticeReview = {
    transcriptRevision: "sample-practice-transcript-1",
    origin: "practice_roleplay",
    items: [
      { questionId: "sample-fee", gap: "follow-up needed", turnIds: ["sample-turn-fee"], rationale: "The amount and timing were stated, but refundability was not established.", followUp: "Is any part of the $300 administrative fee refundable?", origin: "practice_roleplay" },
      { questionId: "sample-water", gap: "follow-up needed", turnIds: ["sample-turn-water"], rationale: "The response was conditional and did not answer the specific unit question.", followUp: "For this unit, is water included in rent or billed separately?", origin: "practice_roleplay" },
      { questionId: "sample-notice", gap: "follow-up needed", turnIds: ["sample-turn-notice", "sample-turn-notice-correction"], rationale: "The first response conflicted with the fictional written term and required clarification.", followUp: "Please confirm the written notice period for this lease.", origin: "practice_roleplay" },
    ],
  };
  return { agenda, turns, review };
}
