export type TexasRenterTopic =
  | "securityDeposit"
  | "repairs"
  | "lateFees"
  | "lockoutOrUtilities"
  | "landlordEntry";

export type TexasSourceType =
  | "official_statute"
  | "state_law_library"
  | "legal_aid_resource"
  | "public_agency_resource";

/** Curated topic record — static links only; never scraped at runtime. */
export type TexasRenterTopicRecord = {
  id: string;
  topic: TexasRenterTopic;
  topicLabel: string;
  jurisdiction: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: TexasSourceType;
  sourceSectionLabel: string;
  plainEnglishSummary: string;
  safeOutputTemplate: string;
  questionToAsk: string;
  reviewedAt: string;
  effectiveThrough: string | null;
  reviewNotes?: string;
  /** When false, lease topic detection still runs but contextual source claims are omitted. */
  contextEnabled: boolean;
};

export const TEXAS_RENTER_TOPIC_RECORDS: Record<TexasRenterTopic, TexasRenterTopicRecord> = {
  securityDeposit: {
    id: "tx-property-code-92-deposits",
    topic: "securityDeposit",
    topicLabel: "Security deposit",
    jurisdiction: "Texas",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.103",
    sourceType: "official_statute",
    sourceSectionLabel: "Security deposits and return of deposit",
    plainEnglishSummary: "This affects your deposit.",
    safeOutputTemplate: "This affects your deposit.",
    questionToAsk: "What deductions can be taken, and when will the remaining deposit be returned?",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  repairs: {
    id: "tx-property-code-92-repairs",
    topic: "repairs",
    topicLabel: "Repairs",
    jurisdiction: "Texas",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.056",
    sourceType: "official_statute",
    sourceSectionLabel: "Repairs and remedies",
    plainEnglishSummary: "This affects repair responsibility.",
    safeOutputTemplate: "This affects repair responsibility.",
    questionToAsk:
      "Which repairs do I handle, which repairs does the landlord handle, and how should I submit repair requests?",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  lateFees: {
    id: "tx-sll-rent-late-fees",
    topic: "lateFees",
    topicLabel: "Late fees",
    jurisdiction: "Texas",
    sourceTitle: "Texas State Law Library — Landlord/Tenant Law",
    sourceUrl: "https://guides.sll.texas.gov/landlord-tenant-law/rent",
    sourceType: "state_law_library",
    sourceSectionLabel: "Rent, late charges, and fees",
    plainEnglishSummary: "This affects what you pay if rent is late.",
    safeOutputTemplate: "This affects what you pay if rent is late.",
    questionToAsk: "When does the fee start, and how is it calculated?",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  lockoutOrUtilities: {
    id: "tx-property-code-92-lockout-utilities",
    topic: "lockoutOrUtilities",
    topicLabel: "Lockout or utilities",
    jurisdiction: "Texas",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.0081",
    sourceType: "official_statute",
    sourceSectionLabel: "Lockouts and interruption of utilities",
    plainEnglishSummary: "This affects access to the home or basic services.",
    safeOutputTemplate: "This affects access to the home or basic services.",
    questionToAsk: "What can happen if payment is late, and what notice is given first?",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  landlordEntry: {
    id: "tx-sll-landlord-entry",
    topic: "landlordEntry",
    topicLabel: "Landlord entry",
    jurisdiction: "Texas",
    sourceTitle: "Texas State Law Library — Landlord Entry FAQ",
    sourceUrl: "https://sll.texas.gov/faqs/landlord-entry/",
    sourceType: "state_law_library",
    sourceSectionLabel: "Landlord entry and lease terms",
    plainEnglishSummary: "This affects when the landlord may enter the unit.",
    safeOutputTemplate: "This affects when the landlord may enter the unit.",
    questionToAsk: "How much notice is usually given before entry?",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    reviewNotes:
      "Replaced prior Property Code §92.008 citation (interruption of utilities). Texas has no dedicated landlord-entry statute; this source explains lease-based entry rules.",
    contextEnabled: true,
  },
};

/** Additional curated statewide resources (reference catalog; not scraped). */
export const TEXAS_RENTER_SUPPLEMENTAL_SOURCES: Omit<
  TexasRenterTopicRecord,
  "topic" | "topicLabel" | "questionToAsk"
>[] = [
  {
    id: "texaslawhelp-house-apartment",
    jurisdiction: "Texas",
    sourceTitle: "TexasLawHelp — House & Apartment",
    sourceUrl: "https://texaslawhelp.org/house-apartment",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Residential lease overview",
    plainEnglishSummary: "General Texas renter topics for residential leases.",
    safeOutputTemplate: "Review this statewide Texas renter resource alongside your lease.",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  {
    id: "texaslawhelp-security-deposits",
    jurisdiction: "Texas",
    sourceTitle: "TexasLawHelp — Security Deposits",
    sourceUrl: "https://texaslawhelp.org/article/security-deposits",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Security deposits",
    plainEnglishSummary: "This affects your deposit.",
    safeOutputTemplate: "This affects your deposit.",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  {
    id: "texaslawhelp-repairs",
    jurisdiction: "Texas",
    sourceTitle: "TexasLawHelp — Repairs",
    sourceUrl: "https://texaslawhelp.org/article/repairs",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Repairs and habitability",
    plainEnglishSummary: "This affects repair responsibility.",
    safeOutputTemplate: "This affects repair responsibility.",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  {
    id: "texaslawhelp-lockouts",
    jurisdiction: "Texas",
    sourceTitle: "TexasLawHelp — Lockouts and Utility Shutoffs",
    sourceUrl: "https://texaslawhelp.org/article/lockouts-and-utility-shutoffs",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Lockouts and utility shutoffs",
    plainEnglishSummary: "This affects access to the home or basic services.",
    safeOutputTemplate: "This affects access to the home or basic services.",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
  {
    id: "tx-sll-landlord-tenant",
    jurisdiction: "Texas",
    sourceTitle: "Texas State Law Library — Landlord/Tenant Law",
    sourceUrl: "https://guides.sll.texas.gov/landlord-tenant-law",
    sourceType: "state_law_library",
    sourceSectionLabel: "Landlord-tenant law guide",
    plainEnglishSummary: "Statewide Texas renter law overview.",
    safeOutputTemplate: "Review this statewide Texas renter resource alongside your lease.",
    reviewedAt: "2026-06-10",
    effectiveThrough: null,
    contextEnabled: true,
  },
];

export function getTexasRenterTopicRecord(topic: TexasRenterTopic): TexasRenterTopicRecord {
  return TEXAS_RENTER_TOPIC_RECORDS[topic];
}

export function isTexasContextEnabled(record: TexasRenterTopicRecord): boolean {
  if (!record.contextEnabled) return false;
  if (record.effectiveThrough) {
    const through = Date.parse(record.effectiveThrough);
    if (!Number.isNaN(through) && through < Date.now()) return false;
  }
  return true;
}

/** @deprecated Use topicLabel on findings or getTexasRenterTopicRecord(). */
export const TEXAS_RENTER_TOPIC_LABELS: Record<TexasRenterTopic, string> = {
  securityDeposit: TEXAS_RENTER_TOPIC_RECORDS.securityDeposit.topicLabel,
  repairs: TEXAS_RENTER_TOPIC_RECORDS.repairs.topicLabel,
  lateFees: TEXAS_RENTER_TOPIC_RECORDS.lateFees.topicLabel,
  lockoutOrUtilities: TEXAS_RENTER_TOPIC_RECORDS.lockoutOrUtilities.topicLabel,
  landlordEntry: TEXAS_RENTER_TOPIC_RECORDS.landlordEntry.topicLabel,
};
