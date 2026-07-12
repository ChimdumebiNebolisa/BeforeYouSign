"use client";

import { UploadLeaseCta } from "@/components/beforeyousign/upload-lease-cta";
import { PasteTextDialog } from "@/components/beforeyousign/paste-text-dialog";
import { SampleLeaseCta } from "@/components/beforeyousign/sample-lease-cta";
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
};

export function LandingIntakeCard({
  onStartUpload,
  onStartPaste,
  onStartSample,
  pasteOpenRequestVersion = 0,
  activeTab,
  onTabChange,
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
      className="bys-glass-panel scroll-mt-32 space-y-6 rounded-3xl border border-white/60 p-6 shadow-[0px_24px_48px_rgba(0,32,69,0.08)] sm:p-8 lg:sticky lg:top-28"
    >
      <div className="space-y-1 text-center lg:text-left">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl font-bold text-foreground">Review a lease</h2>
        <p className="text-sm text-muted-foreground">Upload a PDF, paste text, or run the sample lease.</p>
      </div>

      <div className="flex rounded-full bg-muted p-1" role="tablist" aria-label="Lease intake options">
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
              "flex-1 rounded-full px-3 py-2.5 text-xs font-semibold transition sm:text-sm",
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
    </div>
  );
}
