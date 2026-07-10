/** Shared user-facing copy for disclaimers and privacy notices. */

export const PRIVACY_BLOCK =
  "BeforeYouSign is for educational lease review, not legal advice. We do not use a database or save your report after you close the page unless you explicitly opt into short-lived recovery when that feature is enabled. When you analyze a lease, the text is processed on our server to generate your results. If AI summarization is enabled, lease text is sent to Google Gemini for that request only. See Google's privacy policy for how they handle API data.";

/** Landing intake/footer — processing only; legal disclaimer lives in hero + footer disclaimer. */
export const LANDING_PRIVACY_PROCESSING =
  "We do not save your report after you close the page unless recovery is explicitly enabled. Lease text is processed on our server. If AI summarization is enabled, text is also sent to Google Gemini for that request.";

export const UPLOAD_LIMITS_NOTE =
  "PDF uploads are limited to 10 MB, 100 pages, and 120,000 extracted characters. Pasted text is limited to 120,000 characters.";

export const PRIVACY_CONTINUE_LINE =
  "By continuing, you submit lease text for one-time analysis. Do not upload documents you are not comfortable processing through this tool.";

export const FIXED_REPORT_DISCLAIMER =
  "Educational information only. Not legal advice. BeforeYouSign helps you review lease wording and prepare questions, but it does not recommend whether to sign or whether a term is lawful.";

export const LOCAL_LAW_BANNER =
  "Local landlord-tenant law was not checked. Review important terms with a qualified attorney, tenant resource, or university legal service.";

/* Landing page — Texas-first positioning */

export const LANDING_HEADLINE = "Understand your lease before you sign.";

export const LANDING_SUBHEADLINE =
  "Upload or paste a Texas residential lease to find key costs, deadlines, terms to review, and questions to ask.";

export const LANDING_SUPPORT_NOTE =
  "Texas leases only for now. City rules are not checked. Educational only, not legal advice.";

export const TEXAS_LEASES_ONLY_BADGE = "Texas leases only";

export const TEXAS_RENTER_CHECK_PREVIEW =
  "BeforeYouSign looks for common Texas renter topics like deposits, repairs, late fees, lockouts, utilities, and landlord entry.";

export const TEXAS_RENTER_CHECK_SAFETY =
  "These notes use statewide Texas renter resources. City rules are not checked. This is not legal advice.";

export const TEXAS_RENTER_CHECK_SOURCE_NOTE_LANDING =
  "Texas renter check notes include a source link when a topic is matched.";

export const TEXAS_RENTER_CHECK_EXAMPLES = [
  "This affects your deposit.",
  "This affects repair responsibility.",
  "This affects what you pay if rent is late.",
  "This affects access to the home or basic services.",
  "This affects when the landlord can enter the unit.",
] as const;

export const OCR_WARNING =
  "Scanned image-only PDFs may not extract correctly. Paste the text if the report looks incomplete.";

export const FOUND_IN_LEASE_BADGE = "Found in lease";
export const TEXAS_RENTER_CHECK_BADGE = "Texas renter check";
export const MISSING_UNCLEAR_BADGE = "Missing or unclear";
export const CITY_RULES_NOT_CHECKED_BADGE = "City rules are not checked";

export const TEXAS_RENTER_CHECK_NOTE =
  "These notes use statewide Texas renter resources. City rules are not checked. This is not legal advice.";

export const TEXAS_RENTER_CHECK_EMPTY =
  "No Texas renter check topics were matched in this lease.";

export const TEXAS_RENTER_SOURCE_NOTE =
  "Statewide Texas source. City rules are not checked.";

export const LANDING_FAQ = [
  {
    question: "Is this legal advice?",
    answer: "No. It is educational only.",
  },
  {
    question: "What leases are supported?",
    answer: "Texas residential leases only for now.",
  },
  {
    question: "Does it check city rules?",
    answer: "No. City rules are not checked.",
  },
  {
    question: "Do you store my lease?",
    answer:
      "The app does not use a database or save your report after you close the page. Lease text is processed on the server, and AI summarization may send text to the AI provider for that request.",
  },
  {
    question: "What if my PDF is scanned?",
    answer: OCR_WARNING,
  },
] as const;

export const LANDING_LIMITATIONS = [
  "It does not provide legal advice.",
  "It does not recommend whether to sign.",
  "It does not decide whether a term is lawful.",
  "It does not check city rules.",
  "It does not replace an attorney, tenant resource, or university legal service.",
] as const;
