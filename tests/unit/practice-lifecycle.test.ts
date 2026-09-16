import { describe, expect, it } from "vitest";
import { initialPracticeSession, reducePracticeEvent, completePracticeTurns } from "@/lib/practice/session";
import { parsePracticeReview } from "@/lib/practice/review";
import { samplePractice } from "@/lib/practice/sample";

describe("Practice Call lifecycle", () => {
  it("ignores late events from an ended session and deduplicates turns", () => {
    const started = reducePracticeEvent(initialPracticeSession(), { type: "start", generation: 0 });
    const withTurn = reducePracticeEvent(started, { type: "renter_transcript", generation: 0, turn: { id: "t1", speaker: "renter", text: "Are there extra fees?", final: true } });
    const duplicate = reducePracticeEvent(withTurn, { type: "renter_transcript", generation: 0, turn: { id: "t1", speaker: "renter", text: "Are there extra fees?", final: true } });
    const ended = reducePracticeEvent(duplicate, { type: "end", generation: 0 });
    const late = reducePracticeEvent(ended, { type: "agent_transcript", generation: 0, turn: { id: "late", speaker: "role_play_representative", text: "late", final: true } });
    expect(duplicate.turns).toHaveLength(1);
    expect(ended.state).toBe("ended");
    expect(late.turns).toHaveLength(1);
    expect(completePracticeTurns([{ id: "partial", speaker: "role_play_representative", text: "cut off", final: true, interrupted: true }])).toHaveLength(0);
  });

  it("rejects review references to incomplete or unknown turns", () => {
    const { agenda } = samplePractice();
    const turns = [{ id: "t1", speaker: "renter" as const, text: "Are there extra fees?", final: true }];
    expect(parsePracticeReview({ transcriptRevision: "1", items: [{ questionId: "sample-fee", gap: "follow-up needed", turnIds: ["unknown"], rationale: "gap", followUp: "What is the amount?" }] }, agenda, turns)).toBeNull();
    expect(parsePracticeReview({ transcriptRevision: "1", items: [{ questionId: "sample-fee", gap: "follow-up needed", turnIds: ["t1"], rationale: "gap", followUp: "What is the amount?" }] }, agenda, turns)?.origin).toBe("practice_roleplay");
  });
});
