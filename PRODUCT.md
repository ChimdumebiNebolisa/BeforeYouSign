# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

BeforeYouSign serves renters, especially students and first-time renters, while they are deciding whether they understand a residential lease well enough to ask informed questions before signing. The primary journey must work for keyboard, screen-reader, low-vision, and mobile users.

## Product Purpose

BeforeYouSign accepts a lease PDF, pasted text, or a sample and produces a plain-language review of costs, deadlines, responsibilities, notable terms, and questions to ask. Success means a renter can identify the few terms that matter, verify every grounded conclusion against the lease, recover from analysis failures, and leave with a short action plan.

## Positioning

The product's defining mechanism is evidence traceability: grounded guidance links to a verified span of the renter's own lease, while unsupported guidance is clearly distinguished from text found in the document.

## Operating Context

The journey runs in one browser session: select a rental-property state, add a lease, confirm the document and jurisdiction, wait for synchronous hybrid analysis, review the report and extracted text, and download a Markdown report or question checklist. Reports are not persisted across refreshes. The current deployment is a protected, limited-user demonstration; it is not approved for unrestricted public AI traffic.

## Capabilities and Constraints

- `POST /api/analyze` uses OpenAI to propose candidate lease claims when configured. The server presents a model claim only after deterministic evidence, category, numeric/date, semantic, and polarity checks pass.
- Deterministic clause scanning, review-priority scoring, and the complete rule-only report remain authoritative and are returned when AI is disabled, unavailable, invalid, or unsupported by the cited source.
- Inputs are PDF upload, pasted text, and bundled samples. PDF analysis uses embedded text extraction and does not perform OCR.
- Texas has statewide renter-reference checks. Other states receive general lease review with an explicit disclosure.
- Reports are educational information, not legal advice, and do not decide whether a term is lawful or whether the renter should sign.
- Evidence may be presented as found in the lease only when its page, offsets, quote, and category relevance are verified.
- AI-assisted review sends extracted lease text to OpenAI through the API. The request uses `store: false`; OpenAI does not train on API data by default and may retain content for abuse monitoring under its API data policy.
- The supported visual theme is light-only.
- There are no accounts, persisted reports, background jobs, or recovery tokens.

## Brand Commitments

Preserve the BeforeYouSign name, existing logos, Inter body type, Manrope headline type, calm renter-focused voice, explicit legal limitations, and the approved contract-review/editorial-annotation direction across the whole journey.

## Evidence on Hand

- Real and synthetic lease fixtures under `fictional_residential_lease_agreement.pdf`, `public/sample-leases/`, and `tests/fixtures/leases/`.
- The UI, UX, and accessibility audit at `docs/BEFOREYOUSIGN_UI_UX_ACCESSIBILITY_AUDIT_2026-09-19.md`.
- Existing deterministic evaluation fixtures and baselines under `evaluation/`.
- Existing BeforeYouSign logos under `public/images/`.
- No testimonials, customer logos, commercial benchmarks, or legal-outcome claims are available and none should be fabricated.

## Product Principles

1. Evidence correctness outranks visual polish.
2. The report, not the uploaded source text, leads the completed experience.
3. Every state change is understandable without relying on sight, motion, or memory.
4. Guidance is calm, specific, and actionable without overstating legal certainty.
5. Recovery preserves the renter's work whenever it is safe to do so.

## Accessibility & Inclusion

Target WCAG 2.2 AA for keyboard access, focus order, status communication, contrast, target size, responsive reflow, landmarks, reduced motion, and assistive-technology clarity. Automated browser checks cover keyboard, focus, status, contrast, target size, reflow, landmarks, and reduced motion. Narrator with Edge and NVDA with Chrome remain separate manual release gates and must be recorded with actual tester and version details.
