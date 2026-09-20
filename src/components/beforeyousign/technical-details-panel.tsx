"use client";

import { displayReviewPriority } from "@/lib/display-labels";

function truncQuote(text: string, max: number): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export type TechnicalDetailsReceipt = {
  fileName: string;
  fileSizeBytes: number;
  contentType: string | null;
  extractedPages?: { page: number; text: string }[];
  rentSnippets?: { page: number; quote: string }[];
  depositSnippets?: { page: number; quote: string }[];
  feeSnippets?: { page: number; quote: string }[];
  noticeSnippets?: { page: number; quote: string }[];
  renewalSnippets?: { page: number; quote: string }[];
  maintenanceSnippets?: { page: number; quote: string }[];
  utilitiesSnippets?: { page: number; quote: string }[];
  ruleBasedFindings?: { category: string; page: number; quote: string }[];
  unclearLeasePhrases?: { page: number; quote: string }[];
  deterministicRiskScore?: number;
  deterministicRiskBand?: "low" | "medium" | "high";
  deterministicRiskReasons?: string[];
};

const detailLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";
const dtClass = "text-[11px] font-medium text-muted-foreground";
const ddClass = "text-xs text-foreground";

export function TechnicalDetailsPanel({ receipt }: { receipt: TechnicalDetailsReceipt }) {
  const scanRows: { label: string; count: number; page: number; quote: string }[] = [];
  const push = (
    label: string,
    arr: { page: number; quote: string }[] | undefined,
  ) => {
    if (!arr?.length) return;
    const first = arr[0];
    if (!first) return;
    scanRows.push({ label, count: arr.length, page: first.page, quote: first.quote });
  };
  push("Rent", receipt.rentSnippets);
  push("Deposit", receipt.depositSnippets);
  push("Fees", receipt.feeSnippets);
  push("Notice", receipt.noticeSnippets);
  push("Renewal", receipt.renewalSnippets);
  push("Maintenance", receipt.maintenanceSnippets);
  push("Utilities", receipt.utilitiesSnippets);

  const firstFinding = receipt.ruleBasedFindings?.[0];

  return (
    <details className="group rounded-xl border border-border/80 bg-muted p-4 text-muted-foreground">
      <summary className="flex min-h-11 cursor-pointer list-none items-center font-[family-name:var(--font-headline)] text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block text-primary transition group-open:rotate-90">›</span>
        How this was analyzed
      </summary>

      <div className="mt-4 space-y-5 text-xs leading-relaxed">
        <section>
          <p className={detailLabel}>Source file</p>
          <dl className="mt-2 grid gap-2 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-x-3">
            <dt className={dtClass}>Name</dt>
            <dd className={`${ddClass} font-medium`}>{receipt.fileName}</dd>
            <dt className={dtClass}>Size</dt>
            <dd className={ddClass}>{receipt.fileSizeBytes.toLocaleString()} bytes</dd>
            <dt className={dtClass}>Type</dt>
            <dd className={ddClass}>{receipt.contentType ?? "—"}</dd>
          </dl>
        </section>

        {receipt.extractedPages && receipt.extractedPages.length > 0 ? (
          <section>
            <p className={detailLabel}>Text extraction</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{receipt.extractedPages.length}</span> page
              {receipt.extractedPages.length === 1 ? "" : "s"} indexed
            </p>
            <div className="mt-2 rounded-lg border border-border bg-card p-3 font-mono text-[11px] leading-snug text-muted-foreground">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">First page preview</p>
              <p className="mt-1.5 whitespace-pre-wrap break-words">
                {receipt.extractedPages[0]?.text
                  ? truncQuote(receipt.extractedPages[0].text, 320)
                  : "—"}
              </p>
            </div>
          </section>
        ) : null}

        {scanRows.length > 0 ? (
          <section>
            <p className={detailLabel}>Clause matches detected</p>
            <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border bg-secondary text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-3 py-2 font-[family-name:var(--font-headline)]">Category</th>
                    <th className="w-14 px-2 py-2 text-center tabular-nums">Hits</th>
                    <th className="px-3 py-2">Example (page)</th>
                  </tr>
                </thead>
                <tbody>
                  {scanRows.map((row) => (
                    <tr key={row.label} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 align-top font-medium text-foreground">{row.label}</td>
                      <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{row.count}</td>
                      <td className="px-3 py-2 align-top text-muted-foreground">
                        <span className="text-[10px] font-semibold text-muted-foreground">p.{row.page}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug">{truncQuote(row.quote, 140)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {receipt.ruleBasedFindings && receipt.ruleBasedFindings.length > 0 ? (
          <section>
            <p className={detailLabel}>Matched lease clauses</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{receipt.ruleBasedFindings.length}</span> pattern match
              {receipt.ruleBasedFindings.length === 1 ? "" : "es"}
              {firstFinding ? (
                <>
                  {" "}
                  · First:{" "}
                  <span className="font-medium text-foreground">
                    [{firstFinding.category}] p.{firstFinding.page}
                  </span>
                </>
              ) : null}
            </p>
            {firstFinding ? (
              <p className="mt-2 rounded-lg border border-border bg-card p-3 text-[11px] leading-snug text-muted-foreground">
                {truncQuote(firstFinding.quote, 200)}
              </p>
            ) : null}
          </section>
        ) : null}

        {receipt.unclearLeasePhrases && receipt.unclearLeasePhrases.length > 0 ? (
          <section className="rounded-lg border border-warning/30 bg-warning-surface p-3 text-warning">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]">Wording to review</p>
            <p className="mt-1 text-xs">
              {receipt.unclearLeasePhrases.length} instance{receipt.unclearLeasePhrases.length === 1 ? "" : "s"} · Example
              (p. {receipt.unclearLeasePhrases[0]?.page}):{" "}
              <span className="font-medium text-warning">{receipt.unclearLeasePhrases[0]?.quote}</span>
            </p>
          </section>
        ) : null}

        {receipt.deterministicRiskBand !== undefined ? (
          <section className="rounded-lg border border-border bg-card p-4 text-foreground shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Pattern scan (informational)
            </p>
            <p className="mt-2 font-[family-name:var(--font-headline)] text-sm font-semibold leading-snug text-foreground">
              Review priority hint:{" "}
              <span>{displayReviewPriority(receipt.deterministicRiskBand)}</span>
            </p>
            {receipt.deterministicRiskReasons?.length ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground marker:font-semibold marker:text-primary">
                {receipt.deterministicRiskReasons.map((r, i) => (
                  <li key={`${i}-${r.slice(0, 24)}`} className="pl-1 leading-snug">
                    {r}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No strong pattern matches from this rule scan.</p>
            )}
          </section>
        ) : null}
      </div>
    </details>
  );
}
