"use client";

import { useState } from "react";

type SampleKey = "standard" | "fee-heavy" | "notice-heavy";

const SAMPLE_PATH: Record<SampleKey, string> = {
  standard: "/sample-leases/standard.txt",
  "fee-heavy": "/sample-leases/fee-heavy.txt",
  "notice-heavy": "/sample-leases/notice-heavy.txt",
};

const SAMPLE_LABEL: Record<SampleKey, string> = {
  standard: "Standard residential lease",
  "fee-heavy": "Lease with extra charges",
  "notice-heavy": "Lease with strict renewal terms",
};

export function SampleLeaseCta({
  onStartSample,
  embedded = false,
}: {
  onStartSample: (text: string) => void;
  embedded?: boolean;
}) {
  const [sampleKey, setSampleKey] = useState<SampleKey>("standard");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="flex w-full min-w-0 flex-col">
      <label className="block w-full text-left">
        {!embedded ? (
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sample lease</span>
        ) : (
          <span className="text-sm text-muted-foreground">Choose a sample residential lease to review.</span>
        )}
        <select
          className={[
            "w-full rounded-xl bg-muted px-3 py-3 text-sm font-medium text-foreground outline-none transition focus:bg-card focus:ring-2 focus:ring-primary/20",
            embedded ? "mt-3" : "mt-2 text-center [text-align-last:center]",
          ].join(" ")}
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

      <button
        type="button"
        className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-primary/35 bg-card px-3 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/55 hover:bg-muted active:scale-[0.99] disabled:opacity-60"
        disabled={isLoading}
        onClick={() => {
          const run = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
              const res = await fetch(SAMPLE_PATH[sampleKey]);
              if (!res.ok) {
                throw new Error("The sample lease could not be loaded. Try again or paste your own text.");
              }
              const text = await res.text();
              const trimmed = text.trim();
              if (!trimmed) {
                throw new Error("Sample file was empty.");
              }
              setHasLoaded(true);
              onStartSample(trimmed);
            } catch (e) {
              setLoadError(e instanceof Error ? e.message : "Could not load the sample lease.");
            } finally {
              setIsLoading(false);
            }
          };
          void run();
        }}
      >
        {isLoading ? "Loading sample…" : "Run Sample Lease"}
      </button>

      {loadError ? <p className="mt-2 text-sm font-medium text-[#ba1a1a]">{loadError}</p> : null}

      {hasLoaded ? (
        <p className="mt-2 text-xs text-[#444651]">Loaded: {SAMPLE_LABEL[sampleKey]}</p>
      ) : null}

    </div>
  );
}
