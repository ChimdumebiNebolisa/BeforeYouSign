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
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page {pageNumber}</h4>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
        {match ? (
          <>
            {match.before}
            <mark
              data-bys-quote-highlight
              className="bys-quote-highlight rounded-sm px-0.5 text-slate-900"
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
}: {
  pages: LeaseTextPage[];
  scrollToPage?: number | null;
  highlight?: { page: number; quote: string } | null;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);

  return (
    <div className="flex max-h-[min(70vh,720px)] min-h-[200px] flex-col rounded-xl border border-slate-200/70 bg-white/50 shadow-sm">
      <div className="border-b border-slate-200/60 px-3 py-2 text-xs font-medium text-slate-600">
        Lease text ({sorted.length} page{sorted.length === 1 ? "" : "s"})
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
