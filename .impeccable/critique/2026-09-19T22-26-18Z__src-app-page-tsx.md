---
target: src/app/page.tsx — BeforeYouSign current report flow
total_score: 27
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 4
timestamp: 2026-09-19T22-26-18Z
slug: src-app-page-tsx
---
## Heuristic scorecard

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Analysis stages are clear, but success has no strong “review ready” transition. |
| 2 | Match between system and real world | 3 | Renter-focused copy is strong; `Pattern scan` and badge-heavy status language feel internal. |
| 3 | User control and freedom | 2 | There is no cancel action and returning to landing does not explain that the report will be lost. |
| 4 | Consistency and standards | 3 | Visual conventions are consistent; the carousel and nested scroll regions are unconventional for a high-stakes report. |
| 5 | Error prevention | 3 | State confirmation and limits prevent mistakes, but the user gets little help validating jurisdiction. |
| 6 | Recognition rather than recall | 3 | Current-section text helps, but nine dots provide no visible report map and evidence jumps lose context. |
| 7 | Flexibility and efficiency | 2 | Multiple intake options help; the nine-step carousel slows scanning and comparison. |
| 8 | Aesthetic and minimalist design | 2 | The completed state keeps intake chrome, gives source text excessive width, and compresses the actual guidance. |
| 9 | Error recognition and recovery | 3 | Retry and paste alternatives preserve input; real upload and failure states were not exercised. |
| 10 | Help and documentation | 3 | Limitations, FAQ, sources, and details are useful, though they compete with the report. |
| **Total** |  | **27/40** | **Acceptable — significant report-stage improvements needed.** |

All ten heuristics apply. Applicable maximum: 40.

## Technical health scorecard

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Tiny carousel targets, low-contrast small text, inactive slide controls, and nested `main` landmarks. |
| Performance | 3/4 | All report slides remain mounted and focusable. |
| Theming | 2/4 | 245 hard-coded hex usages bypass existing theme tokens. |
| Responsive design | 3/4 | Mobile stacks without horizontal overflow; desktop is badly constrained by the wrong 70% width. |
| Implementation integrity | 3/4 | The domain flow is coherent and the deterministic detector is clean. |
| **Total** | **13/20** | **Acceptable — significant fixes remain.** |

## Design specificity

The product-specific content and evidence-linking interaction feel authored for lease review. The visual language does not: pale gradient, large rounded white cards, pill controls, navy CTA, and generic sans-serif hierarchy could belong to many AI document tools. The strongest unique direction is contract annotation and a trustworthy review-desk metaphor; the current styling underuses both.

## Overall impression

The early flow is calm, responsible, and clear. The completed report is the weak point. Cognitive load rises sharply because intake state, source text, carousel guidance, downloads, technical details, and legal caveats all compete. The emotional peak is exact-quote highlighting, but report arrival is an emotional valley because there is no completion handoff and the guidance is visually subordinate to the source.

## What works

- Evidence traceability is the product’s strongest credibility mechanism.
- Trust copy is unusually responsible about state coverage, extraction limits, processing, and legal-advice boundaries.
- Landing, sample selection, confirmation, and progress feedback are clear and responsive.
- The mobile layout avoids document-level horizontal overflow.

## Priority issues

### P1 — The intended 70% height was implemented as 70% width

The newest change modifies `lg:w-[70%] lg:max-w-[70%]`, giving the lease source roughly 739px and the actual report roughly 285px at 1440px. This is a wrong-axis implementation, not a design preference. Headings wrap, cards become tall, and the guidance requires more internal scrolling. Replace the width classes with a height constraint on the intended viewer/scroll region, and restore the prior horizontal allocation or use a report minimum width of 420–480px.

### P1 — Evidence navigation can show the wrong report/source state

Selecting evidence can leave the report header on `Terms to review` while the visible Embla content is another section because native horizontal `scrollLeft` and the Embla transform both move. The `Guest limits` finding also highlighted a maintenance/structural-repair clause in the tested sample. In a legal-adjacent product, a visibly mismatched quote is a trust failure. Remove horizontal native scrolling from the evidence jump, reset it before Embla navigation, and add automated finding-to-quote assertions.

### P1 — Completed results remain buried beneath intake state

After success, the page still leads with `Lease intake`. On mobile, confirmation, `Back to landing`, and a large source viewer precede the report. Replace the intake form with a compact document receipt, move focus to `Analysis complete` / `Your lease review`, show the summary first on mobile, and collapse `View lease text` by default.

### P1 — Carousel accessibility exposes hidden complexity

Inactive slides and their controls remain in the keyboard and accessibility order; 19 tabbable controls were measured outside the selected slide. Pagination dots are about 8×8px and therefore fail robust target sizing. Mark inactive slides `inert` and `aria-hidden`, manage focus on section changes, and wrap each visual dot in a 44×44px button. A labeled mobile section picker would be clearer than nine unlabeled dots.

### P2 — Mobile evidence review is a context-switch trap

Page scroll, source-pane scroll, and report-slide scroll coexist. Choosing evidence moves the user away from the finding with no persistent return path. Use natural document flow on mobile or show evidence inline/in a bottom sheet with `Back to finding`, preserving both scroll positions.

### P2 — Accessibility and theming debt weaken an otherwise careful flow

Small muted text was measured at 2.54:1 and 4.08:1, nested `main` landmarks are present, reduced-motion handling is incomplete, and scoped UI code contains 245 hard-coded hex values. Use semantic tokens with AA contrast, keep one `main`, honor reduced motion everywhere, and either complete the tokenized theme contract or remove the unused one.

### P2 — The report lacks a confident ending

Risk badges arrive before a clear action plan; the experience ends in downloads and repeated caveats. Add a calm summary such as `Review ready — 4 terms worth asking about`, pair risk with action, and finish with a prioritized three-step checklist.

## Persona red flags

### Jordan — first-time renter

- `Lease intake` remains visible after completion.
- `Pattern scan`, attention badges, and nine navigation dots require interpretation.
- Higher-attention language can feel alarming before the recommended action is clear.

### Sam — accessibility-dependent

- Inactive carousel controls remain exposed to keyboard and assistive technology.
- Pagination targets are tiny and several metadata colors are too low-contrast.
- Evidence selection needs explicit focus management; visual highlighting alone is not sufficient.

### Casey — mobile and distracted

- The report begins below the confirmation card and expanded source viewer.
- Three scroll contexts make one-handed navigation fragile.
- Evidence jumps provide no stable route back to the selected finding.

## Minor observations

- Source text is easier to inspect in the wide pane, but the line length is excessive.
- Legal limitations repeat across hero, intake, report, local-law panel, and footer.
- `Back to landing` does not warn that the current report will be lost.
- The report carousel feels closer to onboarding than to a document users must scan and revisit.
- The styling is clean but visually interchangeable with a general AI SaaS product.

## Questions

- Should the corrected height apply to only the lease text scroll region, or the whole two-pane review stage?
- Should the post-analysis layout prioritize the report summary first, or preserve side-by-side source and guidance?
- Should the nine-section carousel become a labeled outline, or remain a carousel with stronger navigation and focus handling?
