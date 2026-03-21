"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type SampleKey = "standard" | "fee-heavy" | "notice-heavy";

const SAMPLE_PATH: Record<SampleKey, string> = {
  standard: "/sample-leases/standard.txt",
  "fee-heavy": "/sample-leases/fee-heavy.txt",
  "notice-heavy": "/sample-leases/notice-heavy.txt",
};

const SAMPLE_LABEL: Record<SampleKey, string> = {
  standard: "Standard lease",
  "fee-heavy": "Fee-heavy lease",
  "notice-heavy": "Notice / renewal–heavy lease",
};

export function SampleLeaseCta({ onStartSample }: { onStartSample: (text: string) => void }) {
  const [sampleKey, setSampleKey] = useState<SampleKey>("standard");
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <label className="mt-3 block w-full text-left text-xs font-medium text-muted-foreground">
        Sample type
        <select
          className="mt-1 w-full rounded-xl border border-border/90 bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          value={sampleKey}
          onChange={(e) => {
            setSampleKey(e.target.value as SampleKey);
            setHasLoaded(false);
            setLoadError(null);
          }}
        >
          {(Object.keys(SAMPLE_PATH) as SampleKey[]).map((key) => (
            <option key={key} value={key}>
              {SAMPLE_LABEL[key]}
            </option>
          ))}
        </select>
      </label>

      <Button
        variant="outline"
        className="mt-3 w-full rounded-full border-border/90 bg-background/60 text-foreground hover:bg-muted/80"
        disabled={isLoading}
        onClick={() => {
          const run = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
              const res = await fetch(SAMPLE_PATH[sampleKey]);
              if (!res.ok) {
                throw new Error(`Sample failed to load (${res.status}).`);
              }
              const text = await res.text();
              const trimmed = text.trim();
              if (!trimmed) {
                throw new Error("Sample file was empty.");
              }
              setPreviewText(trimmed);
              setHasLoaded(true);
              onStartSample(trimmed);
              setIsOpen(true);
            } catch (e) {
              setLoadError(e instanceof Error ? e.message : "Could not load the sample lease.");
            } finally {
              setIsLoading(false);
            }
          };
          void run();
        }}
      >
        {isLoading ? "Loading sample…" : "Try Sample Lease"}
      </Button>

      {loadError ? <p className="mt-2 text-sm font-medium text-red-600">{loadError}</p> : null}

      {hasLoaded ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Sample lease text loaded ({SAMPLE_LABEL[sampleKey]}).
        </p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-2xl rounded-2xl border border-border/90 bg-card p-4 shadow-xl shadow-slate-900/15">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Sample Lease Text</h2>
                <p className="mt-1 text-sm text-muted-foreground">{SAMPLE_LABEL[sampleKey]} — you can use this text for analysis.</p>
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
              readOnly
              value={previewText}
              className="mt-4 h-56 w-full resize-none rounded-xl border border-border/90 bg-muted/30 p-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                className="w-full rounded-full shadow-sm shadow-primary/15 sm:w-auto"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                Continue
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
