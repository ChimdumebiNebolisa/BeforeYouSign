import { useMemo } from "react";
import { samplePractice } from "@/lib/practice/sample";

export function PracticeSample() {
  const sample = useMemo(() => samplePractice(), []);
  return (
    <section className="rounded-2xl border border-[#c5c56d]/40 bg-[#fffaf0] p-5" aria-label="Sample practice">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#757682]">View sample practice</p>
      <h2 className="mt-1 text-xl font-bold text-[#191c1e]">A fictional rehearsal example</h2>
      <p className="mt-2 rounded-xl border border-[#f5c56b] bg-white p-3 text-sm font-semibold text-[#6b4b0b]">SYNTHETIC SAMPLE — no microphone session or provider request was made.</p>
      <p className="mt-3 text-sm leading-relaxed text-[#5c5e68]">This fixed scenario demonstrates a direct answer, a vague answer that needs a follow-up, and a corrected statement. It is not evidence about a real property.</p>
      <div className="mt-4 space-y-2">
        {sample.turns.map((turn) => <p key={turn.id} className="rounded-xl bg-white p-3 text-sm"><span className="font-semibold">Role-play representative:</span> {turn.text}</p>)}
      </div>
      <div className="mt-4 rounded-xl bg-white p-4">
        <p className="font-semibold text-[#191c1e]">Practice review</p>
        {sample.review.items.map((item) => <div key={item.questionId} className="mt-3 text-sm"><p className="font-semibold text-[#27292f]">{item.gap}</p><p className="text-[#5c5e68]">{item.rationale}</p><p className="mt-1 text-[#00246a]">Suggested follow-up: {item.followUp}</p></div>)}
      </div>
    </section>
  );
}
