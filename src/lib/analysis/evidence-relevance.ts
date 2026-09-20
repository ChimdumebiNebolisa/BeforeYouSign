import type { FindingCategory } from "@/lib/analysis/schema";

const CATEGORY_SIGNALS: Record<Exclude<FindingCategory, "other">, RegExp> = {
  fees:
    /\b(?:rent|deposit|fees?|charges?|costs?|payment|damages|interest|parking|cleaning|package|processing|application)\b|\$|\b\d+(?:\.\d+)?\s*%/i,
  renewal: /\b(?:renew(?:s|ed|ing|al)?|month[- ]?to[- ]?month|extension|holdover)\b/i,
  notice: /\b(?:notice|notify|notification|days?|hours?|vacate|move[- ]?out)\b/i,
  maintenance: /\b(?:maintain|maintenance|repairs?|upkeep|cleanliness|structural|hvac|plumbing|electrical|roof|filter)\b/i,
  utilities: /\b(?:utilities?|electric|electricity|gas|water|sewer|trash|internet|cable|heat|meter)\b/i,
  guests: /\bguests?\b|\b(?:consecutive|total)\s+nights?\b/i,
  pets: /\b(?:pets?|animals?)\b/i,
  subletting: /\b(?:sublet|subletting|sublease|assignment|short[- ]?term rental|room rental)\b/i,
  termination: /\b(?:termination|terminate|early move[- ]?out|break(?:ing)? the lease|re[- ]?rent)\b/i,
  entry: /\b(?:landlord|owner|management)\b[^.\n]{0,180}\b(?:enter|entry|access|inspection)\b|\b(?:entry|access)\b[^.\n]{0,120}\b(?:unit|premises)\b/i,
};

/** A finding can claim lease support only when its quote contains a category-relevant signal. */
export function isEvidenceRelevantToFindingCategory(
  category: FindingCategory,
  quote: string,
): boolean {
  if (category === "other") return false;
  return CATEGORY_SIGNALS[category].test(quote);
}
