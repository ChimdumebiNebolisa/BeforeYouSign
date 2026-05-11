import type { BeforeYouSignReport, EvidenceRef } from "@/lib/analysis/schema";

type LabeledRow = BeforeYouSignReport["moneyAndFees"][number];

const GENERIC_MONEY_LABELS = new Set([
  "additional fee",
  "additional charge",
  "charge",
  "cost",
  "fee",
  "fees",
  "other charge",
  "other cost",
  "other fee",
  "required fee",
]);

function normalizeTextKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceText(evidence: EvidenceRef[] | undefined): string {
  return evidence?.map((ev) => ev.quote).join(" ") ?? "";
}

function dedupeEvidence(evidence: EvidenceRef[] | undefined): EvidenceRef[] | undefined {
  if (!evidence?.length) return evidence;

  const seen = new Set<string>();
  const out: EvidenceRef[] = [];

  for (const ev of evidence) {
    const key = `${ev.page}::${normalizeTextKey(ev.quote)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ev);
  }

  return out;
}

export function classifyLeaseMoneyLabel(text: string): string | null {
  const q = normalizeTextKey(text);

  if (/\bsecurity deposit\b|\bdeposit\b[^.]{0,80}\$|\$[\d,]+(?:\.\d{2})?\b[^.]{0,80}\bdeposit\b/.test(q)) {
    return "Security Deposit";
  }
  if (/\bmonthly rent\b|\bbase rent\b|\brent is\b|\brent:\b|\$[\d,]+(?:\.\d{2})?\b[^.]{0,80}\b(?:per month|monthly|\/mo)\b/.test(q)) {
    return "Monthly Rent";
  }
  if (/\bearly\s+(?:termination|move-?out)\b|\bbreak(?:ing)?\s+(?:the\s+)?lease\b/.test(q)) {
    return "Early termination fee";
  }
  if (/\breturned payment\b|\bnsf\b|\brejected\b|\breversed\b/.test(q)) {
    return "Returned payment fee";
  }
  if (/\butility\b[^.]{0,80}\b(?:billing|processing|fee|charge)\b|\b(?:billing|processing)\b[^.]{0,80}\butility\b/.test(q)) {
    return "Utility billing fee";
  }
  if (/\badministrative\b|\badmin\b/.test(q)) {
    return "Administrative fee";
  }
  if (/\bapplication\b/.test(q)) {
    return "Application fee";
  }
  if (/\bprocessing\b/.test(q)) {
    return "Processing fee";
  }
  if (/\bpet\b/.test(q)) {
    return "Pet fee";
  }
  if (/\bparking\b|\breserved parking\b|\bstall\b|\bvehicle\b/.test(q)) {
    return "Parking fee";
  }
  if (/\bclean(?:ing)?\b|\bmove-?out\b/.test(q)) {
    return "Cleaning fee";
  }
  if (/\bmarketing\b/.test(q)) {
    return "Marketing fee";
  }
  if (/\bpackage\b/.test(q)) {
    return "Package fee";
  }
  if (/\blate\b/.test(q)) {
    return "Late fee";
  }

  return null;
}

function isGenericMoneyLabel(label: string): boolean {
  return GENERIC_MONEY_LABELS.has(normalizeTextKey(label));
}

function normalizeMoneyAndFees(rows: LabeledRow[]): LabeledRow[] {
  return rows.map((row) => {
    if (!isGenericMoneyLabel(row.label)) {
      return {
        ...row,
        evidence: dedupeEvidence(row.evidence),
      };
    }

    const label = classifyLeaseMoneyLabel(`${row.label} ${row.value} ${evidenceText(row.evidence)}`);
    return {
      ...row,
      label: label ?? row.label,
      evidence: dedupeEvidence(row.evidence),
    };
  });
}

function normalizedDeadlineLabel(row: LabeledRow): string {
  const text = normalizeTextKey(`${row.label} ${row.value} ${evidenceText(row.evidence)}`);

  if (/\brent increase\b|\bincrease rent\b|\brent may be adjusted\b/.test(text)) {
    return "Rent increase notice";
  }
  if (/\bmove\s*out\b|\bmove-out\b|\bvacate\b/.test(text)) {
    return "Move-out notice";
  }
  if (/\brenew\b|\bnon-renew\b|\bend of the initial term\b|\bmonth-to-month\b/.test(text)) {
    return "Renewal notice";
  }
  if (/\btermination\b|\bterminate\b/.test(text)) {
    return "Termination notice";
  }

  return row.label;
}

function normalizedDeadlineValue(row: LabeledRow): string {
  const text = `${row.value} ${evidenceText(row.evidence)}`;
  const dayMatch = text.match(/\b\d{1,3}\s*(?:calendar\s+)?days?\b/i);
  if (dayMatch) return dayMatch[0].replace(/\s+/g, " ");

  if (/month-?to-?month/i.test(text)) {
    return "Potential month-to-month renewal";
  }

  return row.value;
}

function normalizeDeadlines(rows: LabeledRow[]): LabeledRow[] {
  const out: LabeledRow[] = [];
  const indexByKey = new Map<string, number>();

  for (const row of rows) {
    const normalizedRow: LabeledRow = {
      ...row,
      label: normalizedDeadlineLabel(row),
      value: normalizedDeadlineValue(row),
      evidence: dedupeEvidence(row.evidence),
    };
    const key = `${normalizeTextKey(normalizedRow.label)}::${normalizeTextKey(normalizedRow.value)}`;
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, out.length);
      out.push(normalizedRow);
      continue;
    }

    const existing = out[existingIndex];
    out[existingIndex] = {
      ...existing,
      evidence: dedupeEvidence([...(existing.evidence ?? []), ...(normalizedRow.evidence ?? [])]),
    };
  }

  return out;
}

export function normalizeReportForCredibility(report: BeforeYouSignReport): BeforeYouSignReport {
  return {
    ...report,
    moneyAndFees: normalizeMoneyAndFees(report.moneyAndFees),
    deadlinesAndNotice: normalizeDeadlines(report.deadlinesAndNotice),
  };
}
