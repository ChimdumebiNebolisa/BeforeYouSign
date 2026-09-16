export type PracticeState = "idle" | "requesting permission" | "connecting" | "ready/listening" | "speaking" | "ending" | "ended" | "error";
export type PracticeTurn = { id: string; speaker: "renter" | "role_play_representative"; text: string; final: boolean; interrupted?: boolean };

export type PracticeEvent =
  | { type: "start"; generation: number }
  | { type: "connected"; generation: number }
  | { type: "speech_started"; generation: number }
  | { type: "renter_transcript"; generation: number; turn: PracticeTurn }
  | { type: "agent_transcript"; generation: number; turn: PracticeTurn }
  | { type: "end"; generation: number }
  | { type: "error"; generation: number };

export type PracticeSession = { generation: number; state: PracticeState; turns: PracticeTurn[]; seenEventIds: string[] };

export function initialPracticeSession(): PracticeSession {
  return { generation: 0, state: "idle", turns: [], seenEventIds: [] };
}

export function reducePracticeEvent(session: PracticeSession, event: PracticeEvent): PracticeSession {
  if (event.type === "start") {
    if (event.generation < session.generation) return session;
    return { ...session, generation: event.generation, state: "requesting permission", turns: [], seenEventIds: [] };
  }
  if (event.generation !== session.generation) return session;
  if (event.type === "connected") return { ...session, state: "ready/listening" };
  if (event.type === "speech_started") {
    const turns = session.turns.map((turn) => turn.speaker === "role_play_representative" && !turn.final ? { ...turn, interrupted: true } : turn);
    return { ...session, state: "ready/listening", turns };
  }
  if (event.type === "renter_transcript" || event.type === "agent_transcript") {
    const next = event.turn;
    if (session.turns.some((turn) => turn.id === next.id)) return session;
    return { ...session, state: next.speaker === "renter" ? "ready/listening" : "speaking", turns: [...session.turns, next] };
  }
  if (event.type === "end") return { ...session, state: "ended", generation: session.generation + 1 };
  return { ...session, state: "error", generation: session.generation + 1 };
}

export function completePracticeTurns(turns: PracticeTurn[]): PracticeTurn[] {
  return turns.filter((turn) => turn.final && !turn.interrupted && turn.text.trim());
}
