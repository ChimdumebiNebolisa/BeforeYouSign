"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PasteTextDialog({ onStartPaste }: { onStartPaste: (text: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pasted, setPasted] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
        onClick={() => setIsOpen(true)}
      >
        Paste Lease Text
      </button>

      {pasted ? (
        <p className="mt-3 text-sm text-slate-700">
          Pasted text loaded ({pasted.length.toLocaleString()} chars).
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white/90 p-4 shadow-lg backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Paste Lease Text</h2>
                <p className="mt-1 text-sm text-slate-600">Paste the lease text you want to analyze.</p>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-4 h-56 w-full resize-none rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-900 outline-none"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                className="w-full rounded-full sm:w-auto"
                onClick={() => {
                  const next = draft.trim();
                  setPasted(next.length ? next : null);
                  setIsOpen(false);
                  if (next.length) onStartPaste(next);
                }}
              >
                Use Pasted Text
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-slate-200/70 bg-white/40 hover:bg-white/60 sm:w-auto"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

