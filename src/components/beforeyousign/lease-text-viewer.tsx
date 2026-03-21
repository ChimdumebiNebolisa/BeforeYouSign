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
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page {pageNumber}</h4>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
        {match ? (
          <>
            {match.before}
            <mark
              data-bys-quote-highlight
              className="bys-quote-highlight rounded-sm px-0.5 text-foreground"
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
}: {
  pages: LeaseTextPage[];
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
  extractedFromPdf?: boolean;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);

  return (
    <div className="flex max-h-[min(70vh,720px)] min-h-[200px] flex-col overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm shadow-slate-900/[0.04]">
      <div className="border-b border-border/80 bg-muted/20 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="normal-case tracking-normal text-foreground">
          Lease text ({sorted.length} page{sorted.length === 1 ? "" : "s"})
        </div>
        {extractedFromPdf ? (
          <p className="mt-1 text-[11px] font-normal normal-case leading-snug text-muted-foreground">
            Extracted from your PDF. This text view is the fallback when precise PDF highlighting is not
            available.
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
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
