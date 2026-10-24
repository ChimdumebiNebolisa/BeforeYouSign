"use client";

import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
import { STATE_OPTIONS, type StateCode } from "@/lib/jurisdiction/states";
import { PRIVACY_CONTINUE_LINE, UPLOAD_LIMITS_NOTE } from "@/lib/public-copy";
import { useRef } from "react";

export type IntakeTab = "upload" | "paste" | "sample";

const TABS: { id: IntakeTab; label: string }[] = [
  { id: "upload", label: "Upload PDF" },
  { id: "paste", label: "Paste Text" },
  { id: "sample", label: "Sample" },
];

type LandingIntakeCardProps = {
  onStartUpload: (file: File) => void;
  onStartPaste: (text: string) => void;
  onStartSample: (text: string) => void;
  pasteOpenRequestVersion?: number;
  activeTab: IntakeTab;
  onTabChange: (tab: IntakeTab) => void;
  stateCode: StateCode;
  onStateChange: (stateCode: StateCode) => void;
};

export function LandingIntakeCard({
  onStartUpload,
  onStartPaste,
  onStartSample,
  pasteOpenRequestVersion = 0,
  activeTab,
  onTabChange,
  stateCode,
  onStateChange,
}: LandingIntakeCardProps) {
  const tabRefs = useRef<Record<IntakeTab, HTMLButtonElement | null>>({
    upload: null,
    paste: null,
    sample: null,
  });

  const moveTab = (tab: IntakeTab) => {
    onTabChange(tab);
    tabRefs.current[tab]?.focus();
  };

  return (
    <div
      id="review-intake"
      className="bys-glass-panel bys-float-shadow scroll-mt-32 space-y-4 rounded-2xl border border-border p-4 sm:p-5 lg:sticky lg:top-28"
    >
      <div className="space-y-0.5 text-left">
        <h2 className="font-[family-name:var(--font-headline)] text-xl font-bold text-foreground">Review a lease</h2>
        <p className="text-xs text-muted-foreground">Upload a PDF, paste text, or run the sample lease.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lease-state" className="text-xs font-semibold text-foreground">
          Rental property state
        </label>
        <select
          id="lease-state"
          value={stateCode}
          onChange={(event) => onStateChange(event.target.value as StateCode)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
        >
          {STATE_OPTIONS.map((state) => (
            <option key={state.code} value={state.code}>
              {state.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] leading-snug text-muted-foreground">
          State-specific renter guidance is currently available for Texas. Other states receive general lease review
          only.
        </p>
      </div>

      <div className="flex rounded-lg bg-muted p-1" role="tablist" aria-label="Lease intake options">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            ref={(element) => {
              tabRefs.current[tab.id] = element;
            }}
            id={`lease-intake-tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="lease-intake-panel"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={[
              "min-h-9 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
              activeTab === tab.id
                ? "bg-card text-primary shadow-sm ring-1 ring-primary/20"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(event) => {
              const currentIndex = TABS.findIndex((item) => item.id === tab.id);
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveTab(TABS[(currentIndex + 1) % TABS.length].id);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveTab(TABS[(currentIndex - 1 + TABS.length) % TABS.length].id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id="lease-intake-panel"
        role="tabpanel"
        aria-labelledby={`lease-intake-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === "upload" ? <UploadLeaseCta onStartUpload={onStartUpload} /> : null}
        {activeTab === "paste" ? (
          <PasteTextDialog embedded onStartPaste={onStartPaste} openRequestVersion={pasteOpenRequestVersion} />
        ) : null}
        {activeTab === "sample" ? <SampleLeaseCta embedded onStartSample={onStartSample} /> : null}
      </div>

      <details className="border-t border-border/70 pt-2 text-[11px] text-muted-foreground">
        <summary className="cursor-pointer font-medium text-primary outline-none marker:text-primary focus-visible:ring-2 focus-visible:ring-ring">
          Upload, privacy &amp; document limits
        </summary>
        <div className="space-y-2 pt-2 leading-relaxed">
          <p>{PRIVACY_CONTINUE_LINE}</p>
          <p>{UPLOAD_LIMITS_NOTE}</p>
        </div>
      </details>
    </div>
  );
}
