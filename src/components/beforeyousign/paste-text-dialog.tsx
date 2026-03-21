"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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
    setIsOpen(true);
  }, [openRequestVersion]);

  return (
    <>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setIsOpen(true)}
      >
        Paste Lease Text
      </button>

      {pasted ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Pasted text loaded ({pasted.length.toLocaleString()} chars).
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl border border-border/90 bg-card p-4 shadow-xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Paste Lease Text</h2>
                <p className="mt-1 text-sm text-muted-foreground">Paste the lease text you want to analyze.</p>
              </div>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-4 h-56 w-full resize-none rounded-xl border border-border/90 bg-muted/30 p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                className="w-full rounded-full shadow-sm shadow-primary/15 sm:w-auto"
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
                className="w-full rounded-full border-border/90 bg-background/80 hover:bg-muted/80 sm:w-auto"
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

