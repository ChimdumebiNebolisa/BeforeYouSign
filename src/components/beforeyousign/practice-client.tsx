"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { createAgendaRevision } from "@/lib/practice/agenda";
import { parseAgendaSnapshot, type AgendaItem, type AgendaSnapshot } from "@/lib/practice/contracts";
import { PracticeCallPanel } from "@/components/beforeyousign/practice-call-panel";
import { PracticeSample } from "@/components/beforeyousign/practice-sample";

export function PracticeClient() {
  const [agenda, setAgenda] = useState<AgendaSnapshot | null>(null);
  const [operatorToken, setOperatorToken] = useState("");
  const [sharedContext, setSharedContext] = useState("");
  const [newQuestion, setNewQuestion] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      try {
        const raw = window.sessionStorage.getItem("bys:agenda");
        const parsed = raw ? parseAgendaSnapshot(JSON.parse(raw)) : null;
        if (active && parsed) { setAgenda(parsed); setSharedContext(parsed.sharedContext); }
      } catch {
        window.sessionStorage.removeItem("bys:agenda");
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  const saveAgenda = (next: AgendaSnapshot) => {
    setAgenda(next);
    setSharedContext(next.sharedContext);
    window.sessionStorage.setItem("bys:agenda", JSON.stringify(next));
  };

  const revise = (items: AgendaItem[], origin: AgendaSnapshot["origin"] = "practice_revision") => {
    if (!agenda) return;
    saveAgenda(createAgendaRevision({ ...agenda, sharedContext }, items, origin));
  };

  const addQuestion = () => {
    if (!agenda || !newQuestion.trim() || agenda.items.length >= 8) return;
    revise([...agenda.items, { id: `user-${Date.now()}`, category: "other", question: newQuestion.trim(), why: "User-added factual question.", expectedAnswer: "mixed", sourceRefs: [], sourceLabel: "user_added" }]);
    setNewQuestion("");
  };

  const downloadQuestions = () => {
    if (!agenda) return;
    const lines = ["# BeforeYouSign — Questions for the leasing office", "", "These are user questions, not automated calls or landlord evidence.", "", "## Questions", ...agenda.items.flatMap((item) => [`- ${item.question}`, item.sourceRefs.length ? `  - Lease support: ${item.sourceRefs.map((ref) => `p.${ref.page}: ${ref.quote}`).join(" | ")}` : "  - No supporting passage was identified in the analyzed text."]), "", "## Shared context", agenda.sharedContext || "No additional context selected."];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "beforeyousign-questions.md";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 font-sans">
      <main className="bys-float-shadow space-y-6 rounded-[2rem] bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#757682]">Question rehearsal workspace</p><h1 className="mt-1 font-[family-name:var(--font-headline)] text-3xl font-extrabold tracking-tight text-[#191c1e]">Practice the questions you want to ask</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#5c5e68]">Review evidence-linked questions, optionally rehearse with a fictional representative, inspect missed follow-ups, and export the questions for a conversation you handle yourself.</p></div><Link href="/" className="shrink-0 rounded-xl border border-[#c5c5d3]/40 bg-[#f2f4f6] px-4 py-2 text-sm font-semibold text-[#191c1e]">Analyze a lease</Link></div>
        <p className="rounded-xl border border-[#f5c56b] bg-[#fffaf0] p-4 text-sm font-semibold leading-relaxed text-[#6b4b0b]">PRACTICE — AI ROLE-PLAY. No leasing office is being contacted. These responses are not statements from your landlord.</p>

        {!agenda ? <section className="rounded-2xl border border-[#c5c5d3]/40 bg-[#f8fafb] p-5"><p className="text-sm font-semibold text-[#191c1e]">No analyzed lease is loaded</p><p className="mt-2 text-sm text-[#5c5e68]">Return to analysis to generate evidence-linked questions, or add a clearly user-entered factual question here.</p><Link href="/" className="mt-4 inline-flex rounded-xl bg-[#191c1e] px-4 py-2 text-sm font-semibold text-white">Return to analysis</Link><div className="mt-4 flex gap-2"><input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder="Add a factual question" className="h-11 min-w-0 flex-1 rounded-xl border border-[#c5c5d3]/60 bg-white px-3 text-sm" /><Button onClick={() => { if (!newQuestion.trim()) return; const next: AgendaSnapshot = { kind: "agenda_snapshot", revisionId: `user-agenda-${Date.now()}`, document: { documentId: "user-entered", fileName: "user-entered-questions", revision: "user-entered", extractionLimitations: [] }, items: [{ id: `user-${Date.now()}`, category: "other", question: newQuestion.trim(), why: "User-added factual question.", expectedAnswer: "mixed", sourceRefs: [], sourceLabel: "user_added" }], sharedContext: "", origin: "lease_report", approval: null }; saveAgenda(next); setNewQuestion(""); }} disabled={!newQuestion.trim()} className="rounded-xl">Add</Button></div></section> : null}

        {agenda ? <>
          <section className="rounded-2xl border border-[#c5c5d3]/40 bg-[#f8fafb] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#757682]">Practice question set — {agenda.revisionId}</p><p className="mt-1 text-sm text-[#5c5e68]">{agenda.items.length}/8 questions. Editing or transferring a suggestion creates a new practice revision.</p></div><div className="flex gap-2"><Button variant="outline" onClick={downloadQuestions} className="rounded-xl">Export questions</Button><button type="button" onClick={() => { setAgenda(null); window.sessionStorage.removeItem("bys:agenda"); }} className="text-xs font-semibold text-[#9a3412]">Clear practice session</button></div></div><div className="mt-4 space-y-3">{agenda.items.map((item, index) => <div key={item.id} className="rounded-xl bg-white p-3"><div className="flex gap-2"><textarea value={item.question} onChange={(event) => setAgenda((current) => current ? { ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, question: event.target.value, sourceRefs: [], sourceLabel: "edited" } : entry), origin: "practice_revision" } : current)} onBlur={(event) => { if (event.target.value.trim()) revise(agenda.items.map((entry) => entry.id === item.id ? { ...entry, question: event.target.value.trim(), sourceRefs: [], sourceLabel: "edited" } : entry)); }} rows={2} className="min-w-0 flex-1 rounded-lg border border-[#c5c5d3]/45 p-2 text-sm" /><div className="flex flex-col gap-1"><button type="button" onClick={() => index > 0 && revise([...agenda.items.slice(0, index - 1), item, agenda.items[index - 1], ...agenda.items.slice(index + 1)])} disabled={index === 0} className="rounded border px-2 text-xs disabled:opacity-30">↑</button><button type="button" onClick={() => index < agenda.items.length - 1 && revise([...agenda.items.slice(0, index), agenda.items[index + 1], item, ...agenda.items.slice(index + 2)])} disabled={index === agenda.items.length - 1} className="rounded border px-2 text-xs disabled:opacity-30">↓</button><button type="button" onClick={() => revise(agenda.items.filter((entry) => entry.id !== item.id))} disabled={agenda.items.length <= 1} className="rounded border px-2 text-xs text-[#9a3412] disabled:opacity-30">×</button></div></div><p className="mt-2 text-xs text-[#757682]">{item.sourceLabel} · {item.sourceRefs.length ? item.sourceRefs.map((ref) => `p.${ref.page}: ${ref.quote}`).join(" | ") : "No supporting passage identified in the analyzed text."}</p></div>)}</div><div className="mt-4 flex gap-2"><input value={newQuestion} onChange={(event) => setNewQuestion(event.target.value)} placeholder="Add a factual question" className="h-10 min-w-0 flex-1 rounded-xl border border-[#c5c5d3]/60 bg-white px-3 text-sm" /><Button onClick={addQuestion} disabled={!newQuestion.trim() || agenda.items.length >= 8} className="rounded-xl">Add</Button></div><textarea value={sharedContext} onChange={(event) => setSharedContext(event.target.value)} onBlur={() => { if (agenda.sharedContext !== sharedContext) revise(agenda.items); }} rows={3} placeholder="Minimum relevant context to share for rehearsal (not the full lease)" className="mt-4 w-full rounded-xl border border-[#c5c5d3]/60 bg-white p-3 text-sm" /><p className="mt-2 text-xs text-[#757682]">Only selected questions and approved minimum context are sent to the configured practice provider after you explicitly start.</p></section>
          <section className="rounded-2xl border border-[#c5c5d3]/40 bg-white p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#757682]">Practice access</p><label className="mt-3 grid max-w-md gap-2 text-sm font-semibold">Local practice access code<input value={operatorToken} onChange={(event) => setOperatorToken(event.target.value)} type="password" autoComplete="off" className="h-11 rounded-xl border border-[#c5c5d3]/60 px-3 font-normal" /><span className="text-xs font-normal text-[#757682]">Checked server-side. Never use a provider API key here. Practice remains disabled unless deliberately enabled in local configuration.</span></label></section>
          <PracticeCallPanel agenda={agenda} operatorToken={operatorToken} onAgendaRevision={saveAgenda} />
        </> : null}

        <PracticeSample />
        <p className="text-xs leading-relaxed text-[#757682]">BeforeYouSign is informational and does not provide legal advice. Practice responses are simulated and never verify, amend, or resolve real lease terms.</p>
      </main>
    </div>
  );
}
