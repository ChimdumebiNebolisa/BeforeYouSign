"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { EvidenceIndex } from "@/lib/evidence/index";
import { lookupEvidenceHighlight } from "@/lib/evidence/index";

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
  highlight?: {
    page: number;
    quote: string;
    startIndex?: number;
    endIndex?: number;
    exact?: boolean;
    evidenceId?: string;
  } | null,
  evidenceIndex?: EvidenceIndex,
): HighlightMatch | null {
  if (!highlight) return null;

  const indexed = lookupEvidenceHighlight(evidenceIndex, highlight.evidenceId);
  if (indexed && indexed.page === highlight.page) {
    const pageStart = indexed.startIndex;
    const pageEnd = indexed.endIndex;
    if (pageStart >= 0 && pageEnd > pageStart && pageEnd <= text.length) {
      return makeHighlightMatch(text, pageStart, pageEnd);
    }
  }

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
          "rounded-sm px-0.5 text-foreground transition-colors duration-200",
          evidenceLinked
            ? "bys-quote-highlight bg-evidence-surface/95 ring-1 ring-ring/20"
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
  highlight,
  evidenceLinked,
  evidenceIndex,
}: {
  pageNumber: number;
  text: string;
  highlight?: {
    page: number;
    quote: string;
    startIndex?: number;
    endIndex?: number;
    exact?: boolean;
    evidenceId?: string;
  } | null;
  evidenceLinked?: boolean;
  evidenceIndex?: EvidenceIndex;
}) {
  const match =
    highlight?.page === pageNumber ? resolveHighlight(text, highlight, evidenceIndex) : null;
  const displayLines = buildDisplayLines(text, match);

  return (
    <article data-page-number={pageNumber} id={`bys-page-${pageNumber}`} className="mb-6 last:mb-0">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Page {pageNumber}</h4>
      <div className="mt-3 space-y-1.5 break-words text-left text-sm leading-relaxed text-muted-foreground">
        {displayLines.map((line, i) => {
          if (line.hidden) return null;

          if (line.kind === "body" && isFictionalDisclaimer(line.text)) {
            return (
              <aside
                key={`${line.start}-${i}`}
                className="rounded-lg border border-evidence/30 bg-evidence-surface px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground"
              >
                <span className="font-semibold uppercase tracking-[0.1em] text-primary">Document note</span>
                <span className="mt-1 block">
                  {renderHighlightedText({ text: line.text, start: line.start, match, evidenceLinked })}
                </span>
              </aside>
            );
          }

          if (line.kind === "heading") {
            return (
              <p
                key={`${line.start}-${i}`}
                className="pt-3 first:pt-0 font-[family-name:var(--font-headline)] text-[13px] font-bold leading-snug tracking-tight text-foreground"
              >
                {renderHighlightedText({ text: line.text, start: line.start, match, evidenceLinked })}
              </p>
            );
          }

          if (line.kind === "meta" && line.meta) {
            return (
              <div
                key={`${line.start}-${i}`}
                className="flex flex-col gap-0.5 rounded-md bg-secondary px-2 py-1.5 text-[13px] leading-snug sm:flex-row sm:gap-3"
              >
                <span className="shrink-0 font-semibold text-foreground sm:w-32">
                  {renderHighlightedText({
                    text: line.meta.label,
                    start: line.start + line.meta.labelStart,
                    match,
                    evidenceLinked,
                  })}
                </span>
                <span className="min-w-0 text-muted-foreground">
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
            <p key={`${line.start}-${i}`} className="text-[13px] leading-relaxed text-muted-foreground">
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
  highlight,
  evidenceLinked,
  evidenceIndex,
  extractedFromPdf,
  fileLabel,
  textPanelExpanded,
  onTextPanelExpandedChange,
  returnToFindingLabel,
  onReturnToFinding,
}: {
  pages: LeaseTextPage[];
  highlight?: {
    page: number;
    quote: string;
    startIndex?: number;
    endIndex?: number;
    exact?: boolean;
    evidenceId?: string;
  } | null;
  evidenceLinked?: boolean;
  evidenceIndex?: EvidenceIndex;
  extractedFromPdf?: boolean;
  fileLabel?: string;
  textPanelExpanded: boolean;
  onTextPanelExpandedChange: (expanded: boolean) => void;
  returnToFindingLabel?: string | null;
  onReturnToFinding?: (() => void) | null;
}) {
  const sorted = [...pages].sort((a, b) => a.page - b.page);
  const bodyId = useId();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (!highlight || !textPanelExpanded) return;
    const frame = window.requestAnimationFrame(() => {
      const body = bodyRef.current;
      const page = body?.querySelector<HTMLElement>(`[data-page-number="${highlight.page}"]`);
      const target = page?.querySelector<HTMLElement>("[data-bys-quote-highlight]") ?? page;
      if (!body || !target) return;

      const bodyRect = body.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetTop = body.scrollTop + targetRect.top - bodyRect.top - (body.clientHeight - targetRect.height) / 2;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      body.scrollTo({ top: Math.max(0, targetTop), behavior: reduceMotion ? "auto" : "smooth" });
      headingRef.current?.focus({ preventScroll: true });
      setAnnouncement(`Evidence highlighted on page ${highlight.page}.`);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlight, textPanelExpanded]);

  const headerBody = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-[family-name:var(--font-headline)] text-[13px] font-bold tracking-tight text-foreground truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {fileLabel ?? "Lease text"}
        </h2>
        {evidenceLinked ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
            Linked
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {sorted.length} page{sorted.length === 1 ? "" : "s"}
        {evidenceLinked ? " · selection below" : ""}
        {textPanelExpanded ? "" : " · text hidden"}
      </p>
      {extractedFromPdf ? (
        <p className="mt-1.5 text-[10px] font-normal normal-case leading-snug text-muted-foreground">
          Extracted text (fallback when precise PDF highlighting isn&apos;t available).
        </p>
      ) : null}
    </div>
  );

  return (
    <div
      data-lease-text-viewer
      className={[
        "flex flex-col overflow-hidden rounded-lg border border-border bg-muted transition-[max-height,min-height] duration-200 motion-reduce:transition-none",
        textPanelExpanded
          ? "max-h-[70vh] min-h-[200px] xl:h-[70vh] xl:max-h-[70vh]"
          : "min-h-0 max-h-none",
        evidenceLinked ? "ring-2 ring-ring/20" : "",
      ].join(" ")}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-border/80 px-3 py-2.5 sm:px-4">
        {headerBody}
        {evidenceLinked && onReturnToFinding ? (
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center rounded-md px-2 text-xs font-semibold text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            onClick={onReturnToFinding}
          >
            Back to {returnToFindingLabel ?? "finding"}
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
          aria-expanded={textPanelExpanded}
          aria-controls={bodyId}
          aria-label={textPanelExpanded ? "Collapse extracted text" : "Expand extracted text"}
          onClick={() => onTextPanelExpandedChange(!textPanelExpanded)}
        >
          <ChevronDown
            className={[
              "h-5 w-5 transition-transform duration-200 motion-reduce:rotate-0 motion-reduce:transition-none",
              textPanelExpanded ? "rotate-180" : "rotate-0",
            ].join(" ")}
            aria-hidden
          />
        </button>
      </div>

      {textPanelExpanded ? (
        <div
          ref={bodyRef}
          id={bodyId}
          className="min-h-0 flex-1 overflow-y-auto rounded-b-lg bg-card p-3.5 sm:p-4"
          aria-label="Extracted lease text"
        >
          {sorted.map((p) => (
            <LeasePageBlock
              key={p.page}
              pageNumber={p.page}
              text={p.text}
              highlight={highlight}
              evidenceLinked={evidenceLinked}
              evidenceIndex={evidenceIndex}
            />
          ))}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
