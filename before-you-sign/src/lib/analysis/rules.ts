import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

export type RentSnippet = {
  page: number;
  quote: string;
};

function dedupeSnippets(items: RentSnippet[]): RentSnippet[] {
  const seen = new Set<string>();
  const out: RentSnippet[] = [];

  for (const item of items) {
    const key = `${item.page}::${item.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

export function findDepositSnippets(pages: ExtractedTextPage[]): RentSnippet[] {
  const patterns: RegExp[] = [
    /\bsecurity\s+deposit\b[^.\n]{0,180}\$[\d,]+(?:\.\d{2})?\b/gi,
    /\bdeposit\b[^.\n]{0,120}\$[\d,]+(?:\.\d{2})?\b/gi,
    /\$[\d,]+(?:\.\d{2})?\b[^.\n]{0,120}\b(?:as\s+(?:a\s+)?)?(?:security\s+)?deposit\b/gi,
  ];

  const matches: RentSnippet[] = [];

  for (const page of pages) {
    const text = page.text;
    if (!text) continue;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const quote = match[0].replace(/\s+/g, " ").trim();
        if (quote.length < 10) continue;
        matches.push({ page: page.page, quote });
      }
    }
  }

  return dedupeSnippets(matches);
}

export function findRentSnippets(pages: ExtractedTextPage[]): RentSnippet[] {
  const patterns: RegExp[] = [
    /\brent\b[^.\n]{0,200}\$[\d,]+(?:\.\d{2})?\b/gi,
    /\$[\d,]+(?:\.\d{2})?\b[^.\n]{0,200}\b(per\s+month|monthly|\/mo|each\s+month)\b/gi,
  ];

  const matches: RentSnippet[] = [];

  for (const page of pages) {
    const text = page.text;
    if (!text) continue;

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const quote = match[0].replace(/\s+/g, " ").trim();
        if (quote.length < 8) continue;
        matches.push({ page: page.page, quote });
      }
    }
  }

  return dedupeSnippets(matches);
}
