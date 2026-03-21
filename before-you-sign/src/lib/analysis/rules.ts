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

export function findFeeSnippets(pages: ExtractedTextPage[]): RentSnippet[] {
  const patterns: RegExp[] = [
    /\b(?:late|administrative|application|processing|pet|parking|cleaning|move-?out|monthly)\s+fees?\b[^.\n]{0,160}\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*(?:month|mo|day|night|package|pet|vehicle))?\b/gi,
    /\b(?:non-?refundable|one-?time)\s+[^.\n]{0,80}\bfees?\b[^.\n]{0,120}\$[\d,]+(?:\.\d{2})?\b/gi,
    /\$[\d,]+(?:\.\d{2})?\b[^.\n]{0,120}\b(?:late|administrative|pet|parking|cleaning)\s+fees?\b/gi,
    /\bfees?\s+of\s+\$[\d,]+(?:\.\d{2})?\b/gi,
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
        if (quote.length < 12) continue;
        matches.push({ page: page.page, quote });
      }
    }
  }

  return dedupeSnippets(matches);
}

export function findNoticeSnippets(pages: ExtractedTextPage[]): RentSnippet[] {
  const patterns: RegExp[] = [
    /\b\d{1,3}\s*(?:calendar\s+)?days?'?\s+(?:written\s+)?notice\b[^.\n]{0,120}/gi,
    /\bwritten\s+notice\b[^.\n]{0,160}\b(?:at\s+least\s+)?\d{1,3}\s*days?\b/gi,
    /\bnotice\s+period\b[^.\n]{0,160}/gi,
    /\b(?:terminate|termination)\b[^.\n]{0,120}\b\d{1,3}\s*days?'?\s+(?:written\s+)?notice\b/gi,
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
        if (quote.length < 15) continue;
        matches.push({ page: page.page, quote });
      }
    }
  }

  return dedupeSnippets(matches);
}

export function findRenewalSnippets(pages: ExtractedTextPage[]): RentSnippet[] {
  const patterns: RegExp[] = [
    /\bautomatic\s+renewal\b[^.\n]{0,200}/gi,
    /\bmonth-?to-?month\b[^.\n]{0,200}/gi,
    /\brenew(?:s|al|ed)?\b[^.\n]{0,200}\b(?:term|lease|agreement)\b/gi,
    /\b(?:extends?|extension)\b[^.\n]{0,160}\b(?:automatically|unless)\b/gi,
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
        if (quote.length < 12) continue;
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
