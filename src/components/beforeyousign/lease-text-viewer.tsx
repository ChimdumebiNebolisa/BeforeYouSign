"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export type LeaseTextPage = { page: number; text: string };

type HighlightMatch = { before: string; match: string; after: string; start: number; end: number };

type DisplayLineKind = "heading" | "meta" | "body";

type DisplayLine = {
  text: string;
  start: number;
  end: number;
  kind: DisplayLineKind;
  hidden?: boolean;
  meta?: {
    label: string;
    labelStart: number;
    value: string;
    valueStart: number;
  };
};

const KNOWN_HEADING_LINES = new Set([
  "lease summary",
  "parties and property",
  "lease term",
  "monthly rent",
  "security deposit",
  "late fees and returned payments",
  "utility accounts and services",
  "maintenance and repairs",
  "landlord entry",
  "renewal and notice",
  "pets, guests, and subletting",
  "early move-out or termination",
  "questions and unclear clauses",
]);

const META_LABELS = [
  "Effective Date",
  "Lease Term",
  "Monthly Rent",
  "Base Rent",
  "Security Deposit",
  "Landlord",
  "Tenant",
  "Premises",
  "Property",
  "Notice Period",
  "Utilities",
  "Late Fee",
  "Administrative Fee",
  "Pet Fee",
  "Parking",
  "Item",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeHighlightMatch(text: string, start: number, end: number): HighlightMatch {
  return {
    before: text.slice(0, start),
    match: text.slice(start, end),
    after: text.slice(end),
    start,
    end,
  };
}

function resolveHighlight(
  text: string,
  highlight?: { page: number; quote: string; startIndex?: number; endIndex?: number; exact?: boolean } | null,
): HighlightMatch | null {
  if (!highlight) return null;

  if (
    typeof highlight.startIndex === "number" &&
    typeof highlight.endIndex === "number" &&
    highlight.startIndex >= 0 &&
    highlight.endIndex > highlight.startIndex &&
    highlight.endIndex <= text.length
  ) {
    const slice = text.slice(highlight.startIndex, highlight.endIndex);
    const normalizedSlice = slice.replace(/\s+/g, " ").trim();
    const normalizedQuote = highlight.quote.replace(/\s+/g, " ").trim();
    if (highlight.exact || normalizedSlice === normalizedQuote || slice === highlight.quote) {
      return makeHighlightMatch(text, highlight.startIndex, highlight.endIndex);
    }
  }

  return splitHighlight(text, highlight.quote);
}

function splitHighlight(text: string, quote: string): HighlightMatch | null {
  const trimmed = quote.trim();
  if (!trimmed) return null;

  const withoutEllipsis = trimmed.replace(/…+$/, "").trim();
  const candidates = [trimmed];
  if (withoutEllipsis && withoutEllipsis !== trimmed) candidates.push(withoutEllipsis);
  if (withoutEllipsis.length > 48) candidates.push(withoutEllipsis.slice(0, 48));

  for (const q of candidates) {
    const idx = text.indexOf(q);
    if (idx !== -1) return makeHighlightMatch(text, idx, idx + q.length);
  }

  const collapsed = (withoutEllipsis || trimmed).replace(/\s+/g, " ").trim();
  if (collapsed.length < 20) return null;

  const words = collapsed.split(" ").filter(Boolean).slice(0, 12);
  if (words.length < 3) return null;

  const pattern = words.map(escapeRegex).join("\\s+");
  const match = new RegExp(pattern, "i").exec(text);
  if (!match) return null;

  return makeHighlightMatch(text, match.index, match.index + match[0].length);
}

function lineOverlapsHighlight(line: DisplayLine, match: HighlightMatch | null): boolean {
  return Boolean(match && line.start < match.end && line.end > match.start);
}

function normalizeDisplayLine(line: string): string {
  return line.trim().replace(/\s+/g, " ").toLowerCase();
}

function isFictionalDisclaimer(line: string): boolean {
  const normalized = normalizeDisplayLine(line);
  return (
    normalized.includes("fictional") &&
    normalized.includes("sample lease") &&
    normalized.includes("product demonstration")
  );
}

function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 48) return false;
  const letters = trimmed.replace(/[^a-z]/gi, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

function splitMetaLine(line: string): DisplayLine["meta"] | undefined {
  const trimmed = line.trim();

  for (const label of META_LABELS) {
    const colonPrefix = `${label}:`;
    if (trimmed.toLowerCase().startsWith(colonPrefix.toLowerCase())) {
      const value = trimmed.slice(colonPrefix.length).trim();
      if (!value) return undefined;
      return {
        label,
        labelStart: line.indexOf(label),
        value,
        valueStart: line.indexOf(value),
      };
    }

    if (trimmed.toLowerCase().startsWith(`${label.toLowerCase()} `)) {
      const value = trimmed.slice(label.length).trim();
      if (!value) return undefined;
      return {
        label,
        labelStart: line.indexOf(label),
        value,
        valueStart: line.indexOf(value),
      };
    }
  }

  return undefined;
}

function classifyDisplayLine(line: string): Pick<DisplayLine, "kind" | "meta"> {
  const trimmed = line.trim();
  const normalized = normalizeDisplayLine(trimmed);
  const meta = splitMetaLine(line);

  if (/^\d{1,2}\.\s+\S/.test(trimmed) || KNOWN_HEADING_LINES.has(normalized) || isAllCapsHeading(trimmed)) {
    return { kind: "heading" };
  }

  if (meta) {
    return { kind: "meta", meta };
  }

  return { kind: "body" };
}

function buildDisplayLines(text: string, match: HighlightMatch | null): DisplayLine[] {
  const lines: DisplayLine[] = [];
  let start = 0;

  for (const rawLine of text.split("\n")) {
    const end = start + rawLine.length;
    const classified = classifyDisplayLine(rawLine);
    lines.push({
      text: rawLine,
      start,
      end,
      ...classified,
    });
    start = end + 1;
  }

  const first = lines[0];
  const second = lines[1];
  if (
    first &&
    second &&
    normalizeDisplayLine(first.text) === normalizeDisplayLine(second.text) &&
    isFictionalDisclaimer(first.text) &&
    !lineOverlapsHighlight(second, match)
  ) {
    second.hidden = true;
  }

  return lines;
}

function renderHighlightedText({
  text,
  start,
  match,
  evidenceLinked,
}: {
  text: string;
  start: number;
  match: HighlightMatch | null;
  evidenceLinked?: boolean;
}) {
  if (!match || start >= match.end || start + text.length <= match.start) {
    return text;
  }

  const localStart = Math.max(0, match.start - start);
  const localEnd = Math.min(text.length, match.end - start);

  return (
    <>
      {text.slice(0, localStart)}
      <mark
        data-bys-quote-highlight
        className={[
          "rounded-sm px-0.5 text-[#191c1e] transition-colors duration-200",
          evidenceLinked
            ? "bys-quote-highlight bg-[#c7d6ff]/95 ring-1 ring-[#00246a]/18"
            : "bys-quote-highlight",
        ].join(" ")}
      >
        {text.slice(localStart, localEnd)}
      </mark>
      {text.slice(localEnd)}
    </>
  );
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
  highlight?: { page: number; quote: string; startIndex?: number; endIndex?: number; exact?: boolean } | null;
  evidenceLinked?: boolean;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const match = highlight?.page === pageNumber ? resolveHighlight(text, highlight) : null;
  const displayLines = buildDisplayLines(text, match);

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
      <div className="mt-3 space-y-1.5 break-words text-left text-sm leading-relaxed text-[#444651]">
        {displayLines.map((line, i) => {
          if (line.hidden) return null;

          if (line.kind === "heading") {
            return (
              <p
                key={`${line.start}-${i}`}
                className="pt-3 first:pt-0 font-[family-name:var(--font-headline)] text-[13px] font-bold leading-snug tracking-tight text-[#191c1e]"
              >
                {renderHighlightedText({ text: line.text, start: line.start, match, evidenceLinked })}
              </p>
            );
          }

          if (line.kind === "meta" && line.meta) {
            return (
              <div
                key={`${line.start}-${i}`}
                className="flex flex-col gap-0.5 rounded-md bg-[#f7f9fb] px-2 py-1.5 text-[13px] leading-snug sm:flex-row sm:gap-3"
              >
                <span className="shrink-0 font-semibold text-[#191c1e] sm:w-32">
                  {renderHighlightedText({
                    text: line.meta.label,
                    start: line.start + line.meta.labelStart,
                    match,
                    evidenceLinked,
                  })}
                </span>
                <span className="min-w-0 text-[#444651]">
                  {renderHighlightedText({
                    text: line.meta.value,
                    start: line.start + line.meta.valueStart,
                    match,
                    evidenceLinked,
                  })}
                </span>
              </div>
            );
          }

          return (
            <p key={`${line.start}-${i}`} className="text-[13px] leading-relaxed text-[#444651]">
              {renderHighlightedText({ text: line.text, start: line.start, match, evidenceLinked })}
            </p>
          );
        })}
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
  highlight?: { page: number; quote: string; startIndex?: number; endIndex?: number; exact?: boolean } | null;
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
