"use client";

import { useEffect, useState } from "react";

export function PasteTextDialog({
  onStartPaste,
  openRequestVersion = 0,
}: {
  onStartPaste: (text: string) => void;
  openRequestVersion?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pasted, setPasted] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (openRequestVersion <= 0) return;
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [openRequestVersion]);

  return (
    <>
      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-[#c5c5d3]/35 bg-[#ffffff] py-3 text-sm font-semibold text-[#191c1e] transition hover:bg-[#f2f4f6] active:scale-[0.99]"
        onClick={() => setIsOpen(true)}
      >
        Paste Text
      </button>

      {pasted ? (
        <p className="mt-2 text-xs text-[#444651]">Pasted text loaded ({pasted.length.toLocaleString()} chars).</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/45 p-4 backdrop-blur-[2px]">
          <div className="bys-modal-shadow w-full max-w-2xl rounded-[1.75rem] bg-[#ffffff] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">
                  Paste lease text
                </h2>
                <p className="mt-1 text-sm text-[#444651]">Paste the lease text you want to analyze.</p>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-medium text-[#757682] hover:bg-[#f2f4f6]"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-4 h-56 w-full resize-none rounded-xl bg-[#f2f4f6] p-3 text-sm text-[#191c1e] outline-none ring-1 ring-[#c5c5d3]/25 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#00246a]/25"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-white shadow-sm sm:w-auto sm:px-6"
                onClick={() => {
                  const next = draft.trim();
                  setPasted(next.length ? next : null);
                  setIsOpen(false);
                  if (next.length) onStartPaste(next);
                }}
              >
                Use pasted text
              </button>
              <button
                type="button"
                className="h-11 w-full rounded-xl bg-[#e0e3e5] text-sm font-semibold text-[#191c1e] sm:w-auto sm:px-6"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
