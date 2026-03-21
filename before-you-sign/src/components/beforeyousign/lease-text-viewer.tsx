"use client";

import { useEffect, useRef } from "react";

export type LeaseTextPage = { page: number; text: string };

export function LeaseTextViewer({
  pages,
  scrollToPage,
}: {
  pages: LeaseTextPage[];
  scrollToPage?: number | null;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollToPage == null || !scrollRootRef.current) return;
    const el = document.getElementById(`bys-page-${scrollToPage}`);
    if (!el || !scrollRootRef.current.contains(el)) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [scrollToPage]);

  return (
    <div className="flex max-h-[min(70vh,720px)] min-h-[200px] flex-col rounded-xl border border-slate-200/70 bg-white/50 shadow-sm">
      <div className="border-b border-slate-200/60 px-3 py-2 text-xs font-medium text-slate-600">
        Lease text ({sorted.length} page{sorted.length === 1 ? "" : "s"})
      </div>
      <div ref={scrollRootRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {sorted.map((p) => (
          <article key={p.page} id={`bys-page-${p.page}`} className="mb-6 last:mb-0">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page {p.page}</h4>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
              {p.text}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
