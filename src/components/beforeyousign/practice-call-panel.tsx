"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { createAgendaRevision } from "@/lib/practice/agenda";
import type { AgendaItem, AgendaSnapshot } from "@/lib/practice/contracts";
import { parsePracticeReview, type PracticeReview } from "@/lib/practice/review";
import { initialPracticeSession, reducePracticeEvent, type PracticeSession, type PracticeTurn } from "@/lib/practice/session";

export function PracticeCallPanel({ agenda, operatorToken, onAgendaRevision }: { agenda: AgendaSnapshot; operatorToken: string; onAgendaRevision: (agenda: AgendaSnapshot) => void }) {
  const [session, setSession] = useState<PracticeSession>(initialPracticeSession());
  const [review, setReview] = useState<PracticeReview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const generation = useRef(0);
  const peer = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const seenEvents = useRef(new Set<string>());

  const apply = (event: Parameters<typeof reducePracticeEvent>[1]) => setSession((current) => reducePracticeEvent(current, event));

  const cleanup = (ended: boolean) => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (audio.current) { audio.current.pause(); audio.current.srcObject = null; }
    channel.current?.close();
    channel.current = null;
    peer.current?.close();
    peer.current = null;
    generation.current += 1;
    if (ended) setSession((current) => reducePracticeEvent(current, { type: "end", generation: current.generation }));
  };

  const addTurn = (turn: PracticeTurn, currentGeneration: number) => {
    apply(turn.speaker === "renter" ? { type: "renter_transcript", generation: currentGeneration, turn } : { type: "agent_transcript", generation: currentGeneration, turn });
  };

  const handleEvent = (raw: unknown, currentGeneration: number) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
    const event = raw as Record<string, unknown>;
    const eventId = typeof event.event_id === "string" ? event.event_id : `${String(event.type)}:${String(event.item_id)}:${String(event.transcript)}`;
    if (seenEvents.current.has(eventId)) return;
    seenEvents.current.add(eventId);
    if (event.type === "input_audio_buffer.speech_started") { apply({ type: "speech_started", generation: currentGeneration }); return; }
    if (event.type === "conversation.item.input_audio_transcription.completed" && typeof event.transcript === "string") {
      addTurn({ id: typeof event.item_id === "string" ? event.item_id : `renter-${seenEvents.current.size}`, speaker: "renter", text: event.transcript, final: true }, currentGeneration);
    }
    if (event.type === "response.output_audio_transcript.done" && typeof event.transcript === "string") {
      addTurn({ id: typeof event.item_id === "string" ? event.item_id : `agent-${seenEvents.current.size}`, speaker: "role_play_representative", text: event.transcript, final: true }, currentGeneration);
    }
  };

  const start = async () => {
    if (session.state === "requesting permission" || session.state === "connecting" || session.state === "ready/listening" || session.state === "speaking") return;
    const currentGeneration = generation.current + 1;
    generation.current = currentGeneration;
    seenEvents.current = new Set();
    setError(null); setReview(null); setSelected([]);
    apply({ type: "start", generation: currentGeneration });
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not provide microphone access.");
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation.current !== currentGeneration) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const pc = new RTCPeerConnection();
      peer.current = pc;
      media.getTracks().forEach((track) => pc.addTrack(track, media));
      pc.ontrack = (event) => { if (audio.current) { audio.current.srcObject = event.streams[0]; void audio.current.play().catch(() => undefined); } };
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onmessage = (event) => { try { handleEvent(JSON.parse(event.data) as unknown, currentGeneration); } catch { /* ignore malformed provider event */ } };
      pc.onconnectionstatechange = () => { if (["failed", "closed", "disconnected"].includes(pc.connectionState) && generation.current === currentGeneration) setError("The practice connection ended before cleanup completed."); };
      apply({ type: "connected", generation: currentGeneration });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch("/api/practice/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sdp: offer.sdp, agenda, operatorToken }) });
      if (!response.ok) { const data = (await response.json().catch(() => null)) as { error?: string } | null; throw new Error(data?.error || "Practice session creation failed."); }
      await pc.setRemoteDescription({ type: "answer", sdp: await response.text() });
      if (generation.current === currentGeneration) setSession((current) => ({ ...current, state: "ready/listening" }));
    } catch (cause) {
      cleanup(false); setSession((current) => ({ ...current, state: "error" })); setError(cause instanceof Error ? cause.message : "Practice could not start.");
    }
  };

  const end = async () => {
    if (!session.turns.length) { cleanup(true); return; }
    const turns = session.turns;
    cleanup(true);
    setReviewing(true); setError(null);
    try {
      const response = await fetch("/api/practice/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agenda, turns, operatorToken }) });
      const data = (await response.json().catch(() => null)) as { review?: unknown; error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "Practice review unavailable.");
      const parsed = parsePracticeReview(data?.review, agenda, turns);
      if (!parsed) throw new Error("Practice review unavailable.");
      setReview(parsed);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Practice review unavailable."); }
    finally { setReviewing(false); }
  };

  const addSelected = () => {
    if (!review || !selected.length) return;
    const additions: AgendaItem[] = review.items.filter((item) => selected.includes(item.questionId)).map((item, index) => ({ id: `practice-${Date.now()}-${index + 1}`, category: "other", question: item.followUp, why: item.rationale, expectedAnswer: "mixed", sourceRefs: [], sourceLabel: "practice_suggestion" }));
    const existing = new Set(agenda.items.map((item) => item.question.toLowerCase()));
    onAgendaRevision(createAgendaRevision(agenda, [...agenda.items, ...additions.filter((item) => !existing.has(item.question.toLowerCase()))]));
    setSelected([]);
  };

  return (
    <section className="rounded-2xl border border-[#c5c5d3]/40 bg-[#fbfcfd] p-5" aria-label="Practice session">
      <audio ref={audio} autoPlay className="hidden" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#757682]">Optional practice session</p>
      <h2 className="mt-1 text-xl font-bold text-[#191c1e]">Practice first</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#5c5e68]">PRACTICE — AI ROLE-PLAY. NO LEASING OFFICE IS BEING CONTACTED. These responses are not statements from your landlord. Audio and selected context are processed by OpenAI.</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => void start()} disabled={["requesting permission", "connecting", "ready/listening", "speaking"].includes(session.state)} className="rounded-xl bys-gradient-cta text-white">{session.state === "idle" || session.state === "ended" || session.state === "error" ? "Start practice" : session.state}</Button><Button variant="outline" onClick={() => void end()} disabled={!(["requesting permission", "connecting", "ready/listening", "speaking"].includes(session.state))} className="rounded-xl">End practice</Button><span className="self-center text-xs text-[#757682]">{session.turns.length} transcript turns</span></div>
      {error ? <p className="mt-3 rounded-xl bg-[#fff1f2] p-3 text-sm text-[#991b1b]">{error}</p> : null}
      {session.turns.length ? <div className="mt-4 space-y-2">{session.turns.map((turn) => <div key={turn.id} className="rounded-xl bg-white p-3 text-sm"><span className="font-semibold">{turn.speaker === "renter" ? "You" : "Role-play representative"}:</span> {turn.text}{turn.interrupted ? <span className="ml-2 text-xs text-[#9a3412]">Interrupted; complete spoken text unavailable.</span> : null}</div>)}</div> : null}
      {reviewing ? <p className="mt-4 text-sm text-[#5c5e68]">Reviewing the completed practice transcript…</p> : null}
      {review ? <div className="mt-4 rounded-xl border border-[#c5c5d3]/35 bg-white p-4"><p className="font-semibold text-[#191c1e]">Practice review</p>{review.items.length ? review.items.map((item) => <label key={item.questionId} className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={selected.includes(item.questionId)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.questionId] : current.filter((id) => id !== item.questionId))} /><span><span className="font-semibold">{item.gap}:</span> {item.rationale}<br /><span className="text-[#00246a]">Suggested follow-up: {item.followUp}</span></span></label>) : <p className="mt-2 text-sm text-[#5c5e68]">No supported question improvements were returned.</p>}<Button onClick={addSelected} disabled={!selected.length} className="mt-4 rounded-xl">Add selected follow-ups to questions</Button><p className="mt-2 text-xs text-[#757682]">Only selected question text is transferred. Practice answers and turns never become lease evidence.</p></div> : null}
    </section>
  );
}
