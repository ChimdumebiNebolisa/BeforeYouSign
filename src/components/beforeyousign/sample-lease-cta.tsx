"use client";

import { useState } from "react";

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
    <div className="flex w-full min-w-0 flex-col">
      <label className="block w-full text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#757682]">Sample lease</span>
        <select
          className="mt-2 w-full rounded-xl bg-[#e0e3e5] px-3 py-3 text-center text-sm font-medium text-[#191c1e] [text-align-last:center] outline-none transition focus:bg-[#ffffff] focus:ring-2 focus:ring-[#00246a]/20"
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
        className="mt-3 inline-flex h-[42px] w-full items-center justify-center rounded-xl bg-[#e0e3e5] px-3 text-sm font-medium text-[#191c1e] transition hover:bg-[#d8dadc] active:scale-[0.99] disabled:opacity-60"
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
      </button>

      {loadError ? <p className="mt-2 text-sm font-medium text-[#ba1a1a]">{loadError}</p> : null}

      {hasLoaded ? (
        <p className="mt-2 text-xs text-[#444651]">Loaded: {SAMPLE_LABEL[sampleKey]}</p>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/45 p-4 backdrop-blur-[2px]">
          <div className="bys-modal-shadow w-full max-w-2xl rounded-[1.75rem] bg-[#ffffff] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-headline)] text-lg font-bold text-[#191c1e]">
                  Sample lease text
                </h2>
                <p className="mt-1 text-sm text-[#444651]">
                  {SAMPLE_LABEL[sampleKey]} — you can use this text for analysis.
                </p>
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
              readOnly
              value={previewText}
              className="mt-4 h-56 w-full resize-none rounded-xl bg-[#f2f4f6] p-3 text-sm text-[#191c1e] outline-none ring-1 ring-[#c5c5d3]/25 focus:ring-2 focus:ring-[#00246a]/25"
            />

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="h-11 w-full rounded-xl bys-gradient-cta text-sm font-bold text-white shadow-sm sm:w-auto sm:px-6"
                onClick={() => {
                  setIsOpen(false);
                }}
              >
                Continue
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
    </div>
  );
}
