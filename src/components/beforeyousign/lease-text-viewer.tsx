"use client";

import { useEffect, useRef } from "react";

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
}: {
  pageNumber: number;
  text: string;
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
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
              className="bys-quote-highlight rounded-sm px-0.5 text-[#191c1e]"
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
  extractedFromPdf,
  fileLabel,
}: {
  pages: LeaseTextPage[];
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
  extractedFromPdf?: boolean;
  fileLabel?: string;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);

  return (
    <div className="flex max-h-[min(70vh,calc(100vh-140px))] min-h-[200px] flex-col overflow-hidden rounded-xl bg-[#f2f4f6] shadow-sm">
      <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-headline)] text-sm font-bold tracking-tight text-[#191c1e] truncate">
            {fileLabel ?? "Lease text"}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#757682]">
            {sorted.length} page{sorted.length === 1 ? "" : "s"}
          </p>
          {extractedFromPdf ? (
            <p className="mt-2 text-[11px] font-normal normal-case leading-snug text-[#444651]">
              Extracted from your PDF. This view is the fallback when precise PDF highlighting is not available.
            </p>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-[#ffffff] p-4 shadow-inner">
        {sorted.map((p) => (
          <LeasePageBlock
            key={p.page}
            pageNumber={p.page}
            text={p.text}
            scrollToPage={scrollToPage}
            highlight={highlight}
          />
        ))}
      </div>
    </div>
  );
}
