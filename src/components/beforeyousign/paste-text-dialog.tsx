"use client";

import { useEffect, useId, useState } from "react";
import { PRIVACY_CONTINUE_LINE, UPLOAD_LIMITS_NOTE } from "@/lib/public-copy";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

export function PasteTextDialog({
  onStartPaste,
  openRequestVersion = 0,
  embedded = false,
}: {
  onStartPaste: (text: string) => void;
  openRequestVersion?: number;
  embedded?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pasted, setPasted] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const textareaId = useId();
  const helperId = useId();
  const dialogTitleId = useId();

  useEffect(() => {
    if (openRequestVersion <= 0) return;
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [openRequestVersion]);

  if (embedded) {
    return (
      <div className="w-full">
        <p className="text-sm text-muted-foreground">Paste the lease text you want to analyze.</p>
        <p id={helperId} className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{PRIVACY_CONTINUE_LINE}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{UPLOAD_LIMITS_NOTE}</p>
        <label htmlFor={textareaId} className="sr-only">
          Lease text to analyze
        </label>
        <textarea
          id={textareaId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-describedby={helperId}
          className="mt-4 h-48 w-full resize-none rounded-xl bg-muted p-3 text-sm text-foreground outline-none ring-1 ring-border/40 focus:bg-card focus:ring-2 focus:ring-primary/25"
          placeholder="Paste your Texas residential lease text here…"
        />
        <button
          type="button"
          className="mt-4 h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-white shadow-sm"
          onClick={() => {
            const next = draft.trim();
            if (next.length > ANALYSIS_LIMITS.maxChars) {
              return;
            }
            setPasted(next.length ? next : null);
            if (next.length) onStartPaste(next);
          }}
          disabled={draft.trim().length > ANALYSIS_LIMITS.maxChars}
        >
          Use pasted text
        </button>
        {pasted ? (
          <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">
            Pasted text loaded ({pasted.length.toLocaleString()} chars).
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-border/60 bg-card py-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.99]"
        onClick={() => setIsOpen(true)}
      >
        Paste Lease Text
      </button>

      {pasted ? (
        <p className="mt-2 text-xs text-muted-foreground">Pasted text loaded ({pasted.length.toLocaleString()} chars).</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/45 p-4 backdrop-blur-[2px]">
          <div
            className="bys-modal-shadow w-full max-w-2xl rounded-[1.75rem] bg-[#ffffff] p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={dialogTitleId}
                  className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]"
                >
                  Paste lease text
                </h2>
                <p className="mt-1 text-sm text-[#444651]">Paste the lease text you want to analyze.</p>
                <p id={helperId} className="mt-2 text-[11px] leading-relaxed text-[#757682]">{PRIVACY_CONTINUE_LINE}</p>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-medium text-[#757682] hover:bg-[#f2f4f6]"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <label htmlFor={textareaId} className="sr-only">
              Lease text to analyze
            </label>
            <textarea
              id={textareaId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-describedby={helperId}
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
