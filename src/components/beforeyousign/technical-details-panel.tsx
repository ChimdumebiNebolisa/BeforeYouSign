"use client";

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

const detailLabel = "text-[10px] font-semibold uppercase tracking-[0.14em] text-[#757682]";
const dtClass = "text-[11px] font-medium text-[#757682]";
const ddClass = "text-xs text-[#191c1e]";

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
    <details className="group rounded-xl border border-[#e0e3e8]/80 bg-[#f2f4f6] p-4 text-[#444651]">
      <summary className="cursor-pointer list-none font-[family-name:var(--font-headline)] text-xs font-bold uppercase tracking-[0.14em] text-[#757682] [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block text-[#00246a] transition group-open:rotate-90">›</span>
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
            <p className="mt-2 text-xs text-[#444651]">
              <span className="font-medium text-[#191c1e]">{receipt.extractedPages.length}</span> page
              {receipt.extractedPages.length === 1 ? "" : "s"} indexed
            </p>
            <div className="mt-2 rounded-lg border border-[#e0e3e8] bg-[#ffffff] p-3 font-mono text-[11px] leading-snug text-[#334155]">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#757682]">First page preview</p>
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
            <div className="mt-2 overflow-x-auto rounded-lg border border-[#e0e3e8] bg-[#ffffff]">
              <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#e8eaef] bg-[#f7f9fb] text-[10px] font-bold uppercase tracking-[0.08em] text-[#757682]">
                    <th className="px-3 py-2 font-[family-name:var(--font-headline)]">Category</th>
                    <th className="w-14 px-2 py-2 text-center tabular-nums">Hits</th>
                    <th className="px-3 py-2">Example (page)</th>
                  </tr>
                </thead>
                <tbody>
                  {scanRows.map((row) => (
                    <tr key={row.label} className="border-b border-[#f0f1f4] last:border-0">
                      <td className="px-3 py-2 align-top font-medium text-[#191c1e]">{row.label}</td>
                      <td className="px-2 py-2 text-center tabular-nums text-[#505f76]">{row.count}</td>
                      <td className="px-3 py-2 align-top text-[#444651]">
                        <span className="text-[10px] font-semibold text-[#757682]">p.{row.page}</span>
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
            <p className="mt-2 text-xs text-[#444651]">
              <span className="font-medium text-[#191c1e]">{receipt.ruleBasedFindings.length}</span> pattern match
              {receipt.ruleBasedFindings.length === 1 ? "" : "es"}
              {firstFinding ? (
                <>
                  {" "}
                  · First:{" "}
                  <span className="font-medium text-[#191c1e]">
                    [{firstFinding.category}] p.{firstFinding.page}
                  </span>
                </>
              ) : null}
            </p>
            {firstFinding ? (
              <p className="mt-2 rounded-lg border border-[#e0e3e8] bg-[#ffffff] p-3 text-[11px] leading-snug text-[#444651]">
                {truncQuote(firstFinding.quote, 200)}
              </p>
            ) : null}
          </section>
        ) : null}

        {receipt.unclearLeasePhrases && receipt.unclearLeasePhrases.length > 0 ? (
          <section className="rounded-lg border border-[#fed7aa] bg-[#fffbeb] p-3 text-[#9a3412]">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em]">Wording to review</p>
            <p className="mt-1 text-xs">
              {receipt.unclearLeasePhrases.length} instance{receipt.unclearLeasePhrases.length === 1 ? "" : "s"} · Example
              (p. {receipt.unclearLeasePhrases[0]?.page}):{" "}
              <span className="font-medium text-[#7c2d12]">{receipt.unclearLeasePhrases[0]?.quote}</span>
            </p>
          </section>
        ) : null}

        {receipt.deterministicRiskBand !== undefined ? (
          <section className="rounded-lg border border-[#e0e3e8] bg-[#ffffff] p-4 text-[#191c1e] shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#757682]">Estimated risk from text patterns</p>
            <p className="mt-2 font-[family-name:var(--font-headline)] text-sm font-semibold leading-snug">
              Band <span className="uppercase">{receipt.deterministicRiskBand}</span>
              <span className="ml-2 font-normal text-[#505f76]">
                (score {receipt.deterministicRiskScore ?? "—"}, not legal advice)
              </span>
            </p>
            {receipt.deterministicRiskReasons?.length ? (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-[#444651] marker:font-semibold marker:text-[#00246a]">
                {receipt.deterministicRiskReasons.map((r, i) => (
                  <li key={`${i}-${r.slice(0, 24)}`} className="pl-1 leading-snug">
                    {r}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs text-[#444651]">No strong risk signals from this rule scan.</p>
            )}
          </section>
        ) : null}
      </div>
    </details>
  );
}
