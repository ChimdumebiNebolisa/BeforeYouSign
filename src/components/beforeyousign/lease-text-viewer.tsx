"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type LeaseTextPage = { page: number; text: string };

function splitHighlight(text: string, quote: string): { before: string; match: string; after: string } | null {
  const q = quote.trim();
  if (!q) return null;
  const idx = text.indexOf(q);
  if (idx === -1) return null;
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + q.length),
    after: text.slice(idx + q.length),
  };
}

function LeasePageBlock({
  pageNumber,
  text,
  scrollToPage,
  highlight,
  evidenceLinked,
}: {
  pageNumber: number;
  text: string;
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
  evidenceLinked?: boolean;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const match = highlight?.page === pageNumber ? splitHighlight(text, highlight.quote) : null;

  useEffect(() => {
    if (scrollToPage !== pageNumber || !rootRef.current) return;
    rootRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollToPage, pageNumber]);

  useEffect(() => {
    if (!match || !rootRef.current) return;
    const id = window.setTimeout(() => {
      const mark = rootRef.current?.querySelector("[data-bys-quote-highlight]");
      mark?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 320);
    return () => window.clearTimeout(id);
  }, [match]);

  return (
    <article ref={rootRef} id={`bys-page-${pageNumber}`} className="mb-6 last:mb-0">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#757682]">Page {pageNumber}</h4>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#444651]">
        {match ? (
          <>
            {match.before}
            <mark
              data-bys-quote-highlight
              className={[
                "rounded-sm px-0.5 text-[#191c1e] transition-colors duration-200",
                match && evidenceLinked
                  ? "bys-quote-highlight bg-[#c7d6ff]/95 ring-1 ring-[#00246a]/18"
                  : "bys-quote-highlight",
              ].join(" ")}
            >
              {match.match}
            </mark>
            {match.after}
          </>
        ) : (
          text
        )}
      </div>
    </article>
  );
}

export function LeaseTextViewer({
  pages,
  scrollToPage,
  highlight,
  evidenceLinked,
  extractedFromPdf,
  fileLabel,
  textPanelExpanded,
  onTextPanelExpandedChange,
}: {
  pages: LeaseTextPage[];
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
  evidenceLinked?: boolean;
  extractedFromPdf?: boolean;
  fileLabel?: string;
  textPanelExpanded: boolean;
  onTextPanelExpandedChange: (expanded: boolean) => void;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);
  const bodyId = useId();

  const headerBody = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-[family-name:var(--font-headline)] text-[13px] font-bold tracking-tight text-[#191c1e] truncate">
          {fileLabel ?? "Lease text"}
        </p>
        {evidenceLinked ? (
          <span className="rounded-full bg-[#dbe1ff] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#00246a]">
            Linked
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#757682]">
        {sorted.length} page{sorted.length === 1 ? "" : "s"}
        {evidenceLinked ? " · selection below" : ""}
        {textPanelExpanded ? "" : " · text hidden"}
      </p>
      {extractedFromPdf ? (
        <p className="mt-1.5 text-[10px] font-normal normal-case leading-snug text-[#444651]">
          Extracted text (fallback when precise PDF highlighting isn&apos;t available).
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      className={[
        "flex flex-col overflow-hidden rounded-lg bg-[#f2f4f6] shadow-sm transition-[box-shadow,max-height,min-height] duration-200",
        textPanelExpanded
          ? "max-h-[min(70vh,calc(100vh-140px))] min-h-[200px]"
          : "min-h-0 max-h-none",
        evidenceLinked ? "ring-2 ring-[#00246a]/18 shadow-[0px_12px_36px_rgba(0,36,106,0.08)]" : "",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-[#e6e8ea]/80 px-3 py-2.5 sm:px-4">
        {headerBody}
        <button
          type="button"
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e6e8ea] bg-[#ffffff] text-[#757682] shadow-sm transition hover:bg-[#f7f9fb] hover:text-[#191c1e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00246a]/25"
          aria-expanded={textPanelExpanded}
          aria-controls={bodyId}
          aria-label={textPanelExpanded ? "Collapse extracted text" : "Expand extracted text"}
          onClick={() => onTextPanelExpandedChange(!textPanelExpanded)}
        >
          <ChevronDown
            className={[
              "h-5 w-5 transition-transform duration-200",
              textPanelExpanded ? "rotate-180" : "rotate-0",
            ].join(" ")}
            aria-hidden
          />
        </button>
      </div>

      {textPanelExpanded ? (
        <div
          id={bodyId}
          className="min-h-0 flex-1 overflow-y-auto rounded-b-lg bg-[#ffffff] p-3.5 shadow-inner sm:p-4"
          aria-label="Extracted lease text"
        >
          {sorted.map((p) => (
            <LeasePageBlock
              key={p.page}
              pageNumber={p.page}
              text={p.text}
              scrollToPage={scrollToPage}
              highlight={highlight}
              evidenceLinked={evidenceLinked}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
