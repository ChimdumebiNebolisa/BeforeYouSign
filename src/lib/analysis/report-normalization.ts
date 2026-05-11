import type { BeforeYouSignReport, EvidenceRef } from "@/lib/analysis/schema";

type LabeledRow = BeforeYouSignReport["moneyAndFees"][number];
type DeadlineKind = "rent-increase" | "move-out" | "renewal" | "termination" | "notice" | "other";

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
    return "Security deposit";
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
  if (/\bpackage\b/.test(q)) {
    return "Package fee";
  }
  if (/\blate\b/.test(q)) {
    return "Late fee";
  }
  if (/\bmonthly rent\b|\bbase rent\b|\brent is\b|\brent:\b|\brent\b[^.]{0,120}\$[\d,]+(?:\.\d{2})?\b|\$[\d,]+(?:\.\d{2})?\b[^.]{0,120}\brent\b/.test(q)) {
    return "Monthly rent";
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

function deadlineKind(row: LabeledRow): DeadlineKind {
  const text = normalizeTextKey(`${row.label} ${row.value} ${evidenceText(row.evidence)}`);

  if (/\brent increase\b|\bincrease rent\b|\brent may be adjusted\b/.test(text)) {
    return "rent-increase";
  }
  if (/\bmove\s*out\b|\bmove-out\b|\bvacate\b/.test(text)) {
    return "move-out";
  }
  if (/\brenew\b|\bnon-renew\b|\bend of the initial term\b|\bmonth-to-month\b/.test(text)) {
    return "renewal";
  }
  if (/\btermination\b|\bterminate\b/.test(text)) {
    return "termination";
  }
  if (/\bnotice\b|\bwritten notice\b|\bdays?\b/.test(text)) {
    return "notice";
  }

  return "other";
}

function normalizedDeadlineLabel(row: LabeledRow): string {
  switch (deadlineKind(row)) {
    case "rent-increase":
      return "Rent increase notice";
    case "move-out":
      return "Move-out notice";
    case "renewal":
      return "Renewal notice";
    case "termination":
      return "Termination notice";
    case "notice":
      return "Notice requirement";
    case "other":
      return row.label;
  }
}

function normalizedEvidenceQuoteKey(row: LabeledRow): string {
  return normalizeTextKey(evidenceText(row.evidence));
}

function normalizedDayWindow(row: LabeledRow): string | null {
  const text = `${row.value} ${evidenceText(row.evidence)}`;
  const dayMatch = text.match(/\b\d{1,3}\s*(?:calendar\s+)?days?\b/i);
  return dayMatch ? dayMatch[0].replace(/\s+/g, " ") : null;
}

function hasReviewClauseValue(row: LabeledRow): boolean {
  return /\breview\b.*\bclause\b/i.test(row.value);
}

function normalizedDeadlineValue(row: LabeledRow): string {
  const dayWindow = normalizedDayWindow(row);
  if (dayWindow) return dayWindow;

  if (/month-?to-?month/i.test(`${row.value} ${evidenceText(row.evidence)}`)) {
    return "Potential month-to-month renewal";
  }

  return row.value;
}

function deadlineDedupeKey(row: LabeledRow): string {
  const kind = deadlineKind(row);
  const dayWindow = normalizedDayWindow(row);
  const quoteKey = normalizedEvidenceQuoteKey(row);
  const isRenewalWithoutConcreteWindow =
    kind === "renewal" && !dayWindow && /month-?to-?month/i.test(`${row.value} ${evidenceText(row.evidence)}`);

  if (dayWindow) {
    return `${kind}::days::${normalizeTextKey(dayWindow)}`;
  }

  if (quoteKey && !isRenewalWithoutConcreteWindow) {
    return `${kind}::quote::${quoteKey}`;
  }

  return `${kind}::${normalizeTextKey(row.label)}::${normalizeTextKey(row.value)}`;
}

function chooseDeadlineValue(existing: LabeledRow, incoming: LabeledRow): string {
  const existingDayWindow = normalizedDayWindow(existing);
  const incomingDayWindow = normalizedDayWindow(incoming);
  if (!existingDayWindow && incomingDayWindow) return incoming.value;
  if (existingDayWindow && !incomingDayWindow) return existing.value;
  if (hasReviewClauseValue(existing) && !hasReviewClauseValue(incoming)) return incoming.value;
  return existing.value;
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
    const key = deadlineDedupeKey(normalizedRow);
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, out.length);
      out.push(normalizedRow);
      continue;
    }

    const existing = out[existingIndex];
    out[existingIndex] = {
      ...existing,
      value: chooseDeadlineValue(existing, normalizedRow),
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
