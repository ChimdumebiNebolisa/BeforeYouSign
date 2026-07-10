export function normalizeEvidenceText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function evidenceDedupeKey(page: number, quote: string): string {
  return `${page}::${normalizeEvidenceText(quote)}`;
}
