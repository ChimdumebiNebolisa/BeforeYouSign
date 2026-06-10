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
  sourceTitle: string;
  sourceUrl: string;
  sourceType: TexasSourceType;
  sourceSectionLabel: string;
  plainEnglishSummary: string;
  safeOutputTemplate: string;
  questionToAsk: string;
};

export const TEXAS_RENTER_TOPIC_RECORDS: Record<TexasRenterTopic, TexasRenterTopicRecord> = {
  securityDeposit: {
    id: "tx-property-code-92-deposits",
    topic: "securityDeposit",
    topicLabel: "Security deposit",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.103",
    sourceType: "official_statute",
    sourceSectionLabel: "Security deposits and return of deposit",
    plainEnglishSummary: "This affects your deposit.",
    safeOutputTemplate: "This affects your deposit.",
    questionToAsk: "What deductions can be taken, and when will the remaining deposit be returned?",
  },
  repairs: {
    id: "tx-property-code-92-repairs",
    topic: "repairs",
    topicLabel: "Repairs",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.056",
    sourceType: "official_statute",
    sourceSectionLabel: "Repairs and remedies",
    plainEnglishSummary: "This affects repair responsibility.",
    safeOutputTemplate: "This affects repair responsibility.",
    questionToAsk:
      "Which repairs do I handle, which repairs does the landlord handle, and how should I submit repair requests?",
  },
  lateFees: {
    id: "tx-sll-rent-late-fees",
    topic: "lateFees",
    topicLabel: "Late fees",
    sourceTitle: "Texas State Law Library — Landlord/Tenant Law",
    sourceUrl: "https://guides.sll.texas.gov/landlord-tenant-law/rent",
    sourceType: "state_law_library",
    sourceSectionLabel: "Rent, late charges, and fees",
    plainEnglishSummary: "This affects what you pay if rent is late.",
    safeOutputTemplate: "This affects what you pay if rent is late.",
    questionToAsk: "When does the fee start, and how is it calculated?",
  },
  lockoutOrUtilities: {
    id: "tx-property-code-92-lockout-utilities",
    topic: "lockoutOrUtilities",
    topicLabel: "Lockout or utilities",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.0081",
    sourceType: "official_statute",
    sourceSectionLabel: "Lockouts and interruption of utilities",
    plainEnglishSummary: "This affects access to the home or basic services.",
    safeOutputTemplate: "This affects access to the home or basic services.",
    questionToAsk: "What can happen if payment is late, and what notice is given first?",
  },
  landlordEntry: {
    id: "tx-property-code-92-entry",
    topic: "landlordEntry",
    topicLabel: "Landlord entry",
    sourceTitle: "Texas Property Code Chapter 92 — Residential Tenancies",
    sourceUrl: "https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm#92.008",
    sourceType: "official_statute",
    sourceSectionLabel: "Landlord's right to enter",
    plainEnglishSummary: "This affects when the landlord can enter the unit.",
    safeOutputTemplate: "This affects when the landlord can enter the unit.",
    questionToAsk: "How much notice is usually given before entry?",
  },
};

/** Additional curated statewide resources (reference catalog; not scraped). */
export const TEXAS_RENTER_SUPPLEMENTAL_SOURCES: Omit<TexasRenterTopicRecord, "topic" | "topicLabel" | "questionToAsk">[] = [
  {
    id: "texaslawhelp-house-apartment",
    sourceTitle: "TexasLawHelp — House & Apartment",
    sourceUrl: "https://texaslawhelp.org/house-apartment",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Residential lease overview",
    plainEnglishSummary: "General Texas renter topics for residential leases.",
    safeOutputTemplate: "Review this statewide Texas renter resource alongside your lease.",
  },
  {
    id: "texaslawhelp-security-deposits",
    sourceTitle: "TexasLawHelp — Security Deposits",
    sourceUrl: "https://texaslawhelp.org/article/security-deposits",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Security deposits",
    plainEnglishSummary: "This affects your deposit.",
    safeOutputTemplate: "This affects your deposit.",
  },
  {
    id: "texaslawhelp-repairs",
    sourceTitle: "TexasLawHelp — Repairs",
    sourceUrl: "https://texaslawhelp.org/article/repairs",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Repairs and habitability",
    plainEnglishSummary: "This affects repair responsibility.",
    safeOutputTemplate: "This affects repair responsibility.",
  },
  {
    id: "texaslawhelp-lockouts",
    sourceTitle: "TexasLawHelp — Lockouts and Utility Shutoffs",
    sourceUrl: "https://texaslawhelp.org/article/lockouts-and-utility-shutoffs",
    sourceType: "legal_aid_resource",
    sourceSectionLabel: "Lockouts and utility shutoffs",
    plainEnglishSummary: "This affects access to the home or basic services.",
    safeOutputTemplate: "This affects access to the home or basic services.",
  },
  {
    id: "tx-sll-landlord-tenant",
    sourceTitle: "Texas State Law Library — Landlord/Tenant Law",
    sourceUrl: "https://guides.sll.texas.gov/landlord-tenant-law",
    sourceType: "state_law_library",
    sourceSectionLabel: "Landlord-tenant law guide",
    plainEnglishSummary: "Statewide Texas renter law overview.",
    safeOutputTemplate: "Review this statewide Texas renter resource alongside your lease.",
  },
];

export function getTexasRenterTopicRecord(topic: TexasRenterTopic): TexasRenterTopicRecord {
  return TEXAS_RENTER_TOPIC_RECORDS[topic];
}

/** @deprecated Use topicLabel on findings or getTexasRenterTopicRecord(). */
export const TEXAS_RENTER_TOPIC_LABELS: Record<TexasRenterTopic, string> = {
  securityDeposit: TEXAS_RENTER_TOPIC_RECORDS.securityDeposit.topicLabel,
  repairs: TEXAS_RENTER_TOPIC_RECORDS.repairs.topicLabel,
  lateFees: TEXAS_RENTER_TOPIC_RECORDS.lateFees.topicLabel,
  lockoutOrUtilities: TEXAS_RENTER_TOPIC_RECORDS.lockoutOrUtilities.topicLabel,
  landlordEntry: TEXAS_RENTER_TOPIC_RECORDS.landlordEntry.topicLabel,
};
