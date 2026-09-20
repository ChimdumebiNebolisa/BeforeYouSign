"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const closeDialog = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (openRequestVersion <= 0) return;
    const id = window.requestAnimationFrame(() => setIsOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, [openRequestVersion]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const focusFrame = window.requestAnimationFrame(() => dialog?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, input, select, [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

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
          placeholder="Paste your residential lease text here…"
        />
        <button
          type="button"
          className="mt-4 h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-primary-foreground shadow-sm"
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
        ref={triggerRef}
        className="mt-3 min-h-11 w-full rounded-xl border border-border/60 bg-card py-3 text-sm font-semibold text-foreground transition hover:bg-muted active:scale-[0.99]"
        onClick={() => setIsOpen(true)}
      >
        Paste Lease Text
      </button>

      {pasted ? (
        <p className="mt-2 text-xs text-muted-foreground">Pasted text loaded ({pasted.length.toLocaleString()} chars).</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/45 p-4 backdrop-blur-[2px]">
          <div
            ref={dialogRef}
            className="bys-modal-shadow w-full max-w-2xl rounded-2xl bg-card p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={dialogTitleId}
                  className="font-[family-name:var(--font-headline)] text-lg font-bold text-foreground"
                >
                  Paste lease text
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Paste the lease text you want to analyze.</p>
                <p id={helperId} className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{PRIVACY_CONTINUE_LINE}</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
                onClick={closeDialog}
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
              className="mt-4 h-56 w-full resize-none rounded-xl bg-muted p-3 text-sm text-foreground outline-none ring-1 ring-border/25 focus:bg-card focus:ring-2 focus:ring-ring/25"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-primary-foreground shadow-sm sm:w-auto sm:px-6"
                onClick={() => {
                  const next = draft.trim();
                  setPasted(next.length ? next : null);
                  closeDialog();
                  if (next.length) onStartPaste(next);
                }}
              >
                Use pasted text
              </button>
              <button
                type="button"
                className="h-11 w-full rounded-xl bg-border text-sm font-semibold text-foreground sm:w-auto sm:px-6"
                onClick={closeDialog}
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
