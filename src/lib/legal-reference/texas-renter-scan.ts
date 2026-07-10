import type { ExtractedTextPage } from "@/lib/pdf/extract-text";
import {
  getTexasRenterTopicRecord,
  isTexasContextEnabled,
  type TexasRenterTopic,
  type TexasSourceType,
} from "@/lib/legal-reference/texas-renter-references";

export type TexasRenterFinding = {
  id: string;
  topic: TexasRenterTopic;
  topicLabel: string;
  page: number;
  leaseQuote: string;
  startIndex?: number;
  endIndex?: number;
  evidenceId?: string;
  explanation: string;
  questionToAsk: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceType?: TexasSourceType;
  sourceSectionLabel?: string;
  plainEnglishSummary?: string;
  contextAvailable: boolean;
};

type TopicRule = {
  topic: TexasRenterTopic;
  patterns: RegExp[];
};

const MAX_QUOTE_CHARS = 220;
const MAX_FINDINGS_PER_TOPIC = 2;

const TOPIC_RULES: TopicRule[] = [
  {
    topic: "securityDeposit",
    patterns: [
      /\bsecurity\s+deposit\b[^.\n]{0,200}/gi,
      /\b(?:return|refund)\s+of\s+(?:the\s+)?deposit\b[^.\n]{0,200}/gi,
      /\bdeposit\b[^.\n]{0,160}\b(?:deduction|refund|return|damages|cleaning)\b[^.\n]{0,120}/gi,
      /\b(?:deduction|cleaning\s+fee)\b[^.\n]{0,160}\bdeposit\b[^.\n]{0,120}/gi,
      /\bdamages\b[^.\n]{0,120}\bdeposit\b[^.\n]{0,120}/gi,
    ],
  },
  {
    topic: "repairs",
    patterns: [
      /\b(?:repair|maintenance)\b[^.\n]{0,200}/gi,
      /\bhabitability\b[^.\n]{0,200}/gi,
      /\b(?:health|safety)\b[^.\n]{0,160}\b(?:repair|maintenance|condition)\b[^.\n]{0,120}/gi,
      /\b(?:plumbing|electrical|mold|air\s+conditioning|heat|hvac)\b[^.\n]{0,200}/gi,
    ],
  },
  {
    topic: "lateFees",
    patterns: [
      /\blate\s+fee\b[^.\n]{0,200}/gi,
      /\blate\s+charge\b[^.\n]{0,200}/gi,
      /\brent\s+is\s+late\b[^.\n]{0,200}/gi,
      /\bdaily\s+fee\b[^.\n]{0,200}/gi,
      /\bgrace\s+period\b[^.\n]{0,200}/gi,
      /\bpast\s+due\b[^.\n]{0,200}/gi,
    ],
  },
  {
    topic: "lockoutOrUtilities",
    patterns: [
      /\blockout\b[^.\n]{0,200}/gi,
      /\bchange\s+locks\b[^.\n]{0,200}/gi,
      /\bremove\s+locks\b[^.\n]{0,200}/gi,
      /\bshut\s+off\s+utilities\b[^.\n]{0,200}/gi,
      /\bdisconnect\s+utilities\b[^.\n]{0,200}/gi,
      /\butility\s+shutoff\b[^.\n]{0,200}/gi,
      /\b(?:shut\s+off|disconnect)\b[^.\n]{0,80}\b(?:electricity|water|gas|utilities)\b[^.\n]{0,120}/gi,
      /\b(?:electricity|water|gas)\b[^.\n]{0,80}\b(?:shut\s+off|disconnect|terminated)\b[^.\n]{0,120}/gi,
    ],
  },
  {
    topic: "landlordEntry",
    patterns: [
      /\blandlord\s+may\s+enter\b[^.\n]{0,200}/gi,
      /\bright\s+to\s+enter\b[^.\n]{0,200}/gi,
      /\baccess\s+to\s+(?:the\s+)?premises\b[^.\n]{0,200}/gi,
      /\bwithout\s+notice\b[^.\n]{0,200}/gi,
      /\breasonable\s+notice\b[^.\n]{0,200}/gi,
      /\b(?:landlord|lessor)\b[^.\n]{0,80}\bentry\b[^.\n]{0,120}/gi,
      /\bentry\b[^.\n]{0,80}\b(?:premises|unit|dwelling|apartment)\b[^.\n]{0,120}/gi,
      /\binspection\b[^.\n]{0,160}\b(?:notice|enter|entry)\b[^.\n]{0,120}/gi,
    ],
  },
];

function normalizeQuoteKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[""]/g, "").trim();
}

function expandToSentence(text: string, start: number, end: number): string {
  let s = start;
  let e = end;

  while (s > 0 && !/[.!?\r\n]/.test(text[s - 1] ?? "")) s--;
  if (s > 0 && /[.!?\r\n]/.test(text[s - 1] ?? "")) s++;
  while (s < text.length && /\s/.test(text[s] ?? "")) s++;

  while (e < text.length && !/[.!?\r\n]/.test(text[e] ?? "")) e++;
  if (e < text.length) e++;

  let quote = text.slice(s, e).replace(/\s+/g, " ").trim();
  const matched = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (matched && !quote.toLowerCase().includes(matched.slice(0, Math.min(15, matched.length)).toLowerCase())) {
    quote = text
      .slice(Math.max(0, start - 20), Math.min(text.length, end + 160))
      .replace(/\s+/g, " ")
      .trim();
  }
  if (quote.length > MAX_QUOTE_CHARS) {
    quote = `${quote.slice(0, MAX_QUOTE_CHARS).trim()}…`;
  }
  return quote;
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  const overlap = Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
  const minLen = Math.min(aEnd - aStart, bEnd - bStart);
  return overlap > 0 && overlap >= minLen * 0.5;
}

type RawMatch = {
  topic: TexasRenterTopic;
  page: number;
  start: number;
  end: number;
  quote: string;
};

function collectMatchesForPage(page: ExtractedTextPage, rule: TopicRule): RawMatch[] {
  const text = page.text;
  if (!text) return [];

  const out: RawMatch[] = [];

  for (const pattern of rule.patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const quote = expandToSentence(text, start, end);
      if (quote.length < 25 && !/\$/.test(quote)) continue;
      out.push({ topic: rule.topic, page: page.page, start, end, quote });
    }
  }

  return out;
}

export function scanTexasRenterTopics(pages: ExtractedTextPage[]): TexasRenterFinding[] {
  const rawMatches: RawMatch[] = [];

  for (const rule of TOPIC_RULES) {
    for (const page of pages) {
      rawMatches.push(...collectMatchesForPage(page, rule));
    }
  }

  rawMatches.sort((a, b) => a.page - b.page || a.start - b.start);

  const usedRanges: { page: number; start: number; end: number }[] = [];
  const seenQuotes = new Set<string>();
  const topicCounts = new Map<TexasRenterTopic, number>();
  const findings: TexasRenterFinding[] = [];

  for (const match of rawMatches) {
    const count = topicCounts.get(match.topic) ?? 0;
    if (count >= MAX_FINDINGS_PER_TOPIC) continue;

    const quoteKey = normalizeQuoteKey(match.quote);
    if (seenQuotes.has(quoteKey)) continue;

    const overlaps = usedRanges.some(
      (r) => r.page === match.page && rangesOverlap(r.start, r.end, match.start, match.end),
    );
    if (overlaps) continue;

    const record = getTexasRenterTopicRecord(match.topic);
    const contextAvailable = isTexasContextEnabled(record);
    const id = `texas-${match.topic}-${match.page}-${findings.length + 1}`;

    findings.push({
      id,
      topic: match.topic,
      topicLabel: record.topicLabel,
      page: match.page,
      leaseQuote: match.quote,
      startIndex: match.start,
      endIndex: match.end,
      explanation: contextAvailable
        ? record.safeOutputTemplate
        : "This lease wording matched a Texas renter topic. Contextual source is under review.",
      questionToAsk: record.questionToAsk,
      ...(contextAvailable
        ? {
            sourceTitle: record.sourceTitle,
            sourceUrl: record.sourceUrl,
            sourceType: record.sourceType,
            sourceSectionLabel: record.sourceSectionLabel,
            plainEnglishSummary: record.plainEnglishSummary,
          }
        : {}),
      contextAvailable,
    });

    seenQuotes.add(quoteKey);
    usedRanges.push({ page: match.page, start: match.start, end: match.end });
    topicCounts.set(match.topic, count + 1);
  }

  return findings;
}
