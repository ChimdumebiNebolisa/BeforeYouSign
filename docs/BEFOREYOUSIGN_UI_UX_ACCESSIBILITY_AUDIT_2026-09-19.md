# BeforeYouSign UI, UX, Accessibility, and Interaction Audit

**Audit date:** 2026-09-19
**Branch:** `main`
**Commit:** `d48f8314ab3587cd611120ddae10c34e698e55de`
**Surface:** Landing, lease intake, PDF analysis, report, evidence navigation, error recovery, downloads, responsive reflow, and assistive-technology behavior
**Intended layout requirement:** the lease viewer should use **70vh height**. It should not receive 70% of the horizontal width.

**Method:** Dual-agent UX and technical review synthesized with live browser evidence, source inspection, real multipart PDF requests, focused export tests, responsive geometry, and accessibility-tree inspection.

## 1. Executive summary

BeforeYouSign has a strong product concept and a responsible early journey. Its clearest differentiator is evidence traceability: a renter can connect an interpreted concern to exact lease language. State confirmation, legal limitations, sample data, and progress feedback are also unusually careful.

The completed-report experience is materially weaker than the intake. The newest layout change implements the requested `70vh` height as `70%` width, shrinking the actual decision-support report to roughly 285px at a 1440px viewport. Report arrival remains buried beneath intake state on mobile, the carousel exposes inactive content to keyboard and assistive technology, and evidence navigation can visibly desynchronize the selected section from the visible slide. One tested finding also highlighted unrelated lease text, which is a major trust problem for a legal-adjacent product.

**Implementation integrity verdict:** The product expresses a coherent, renter-specific system and the deterministic UI detector is clean, but implementation integrity does not pass a release-readiness bar while evidence mapping can be wrong and the newest layout change targets the wrong dimension.

### Combined health

| Measure | Score | Rating |
|---|---:|---|
| Nielsen UX heuristics | **27/40** | Acceptable; report-stage redesign needed |
| Technical UI audit | **13/20** | Acceptable; significant work needed |
| Cognitive-load checklist | **5/8 failures** | High load concentrated in the completed report |
| Severity | **P0 0 · P1 5 · P2 8 · P3 2** | Correctness, report hierarchy, and accessibility lead |

### Highest-priority conclusions

1. Correct the wrong-axis layout regression: restore the horizontal split and apply `70vh` to the intended viewer/scroll region.
2. Treat evidence-to-source correctness as a release gate. A selected finding must never highlight unrelated language.
3. Replace the stale post-analysis intake hierarchy with a clear `Analysis complete` / `Your lease review` handoff.
4. Remove inactive carousel slides from the keyboard and accessibility order and make all navigation targets robust.
5. Add explicit focus and live-region behavior for completion, errors, evidence jumps, and section changes.

## 2. Audit scope and user goal

### Primary user goal

A renter should be able to add a lease, understand the few terms that matter most, verify each conclusion against the source, recover from failure, and leave with a short list of questions to ask before signing.

### Accessibility target

The audited surface should support WCAG 2.2 AA expectations for keyboard access, focus order, status communication, target size, contrast, responsive reflow, reduced motion, landmarks, and assistive-technology clarity.

This report does not claim full WCAG compliance. The implementation was inspected and exercised through browser accessibility output and keyboard checks, but a controllable real screen-reader session was not available in the current automation environment.

## 3. Evidence and test matrix

| Area | Method | Result | Confidence |
|---|---|---|---|
| Landing, samples, confirmation, progress, report | Live browser flow at 1440px and 390×844 in the initial audit | Completed | High |
| 1024/1023 breakpoint boundary | Live browser geometry and screenshots | Abrupt layout discontinuity confirmed | High |
| Evidence navigation | Live finding selection, source highlight, carousel geometry | Desynchronization and unrelated quote confirmed | High |
| Real PDF validity | Parsed local fixture with `pypdf` | 4 pages, 16,370 source characters | High |
| Real multipart PDF analysis | Posted actual PDF to `/api/analyze` | HTTP success; 4 pages, 16,211 extracted characters, complete coverage, 4 findings, 5 questions | High |
| Corrupt PDF handling | Posted a deliberately truncated PDF | HTTP 422, `extraction_failed`, clear recovery message | High |
| UI file chooser and real upload | Live in-app browser flow on `localhost` | Attached the 126,064-byte PDF; UI reported 123 KB, 4 pages, and ready for analysis | High |
| Report/checklist export content | Focused Vitest run | 24/24 tests passed | High for generated content |
| Full automated suite | Vitest | 151/151 tests passed across 21 files | High |
| Live network-failure recovery | Confirmed lease submitted while the local service was deliberately unavailable | Visible `We couldn't finish analysis` state, preserved intake, retry and paste alternatives; focus did not move to the error | High for failure presentation; partial for retry-after-restoration |
| Live download click | In-app browser actions plus filesystem verification | Full report and question checklist both downloaded as readable Markdown | High for this browser/session |
| 200% reflow equivalent | 1280px baseline tested at a 640px CSS viewport | Landing and completed report had no document-level horizontal overflow | High for viewport reflow; actual browser zoom remains unverified |
| Browser accessibility tree | Current and initial audit | Labels, headings, tabs, and exposed inactive content inspected | High |
| Real screen reader | Windows Narrator present; NVDA/JAWS absent; native-app control unavailable | Could not run a verifiable spoken-output session | Explicit verification gap |
| TypeScript | `npm run typecheck` | Passed | High |
| ESLint | `npm run lint` | 0 errors, 1 hook warning | High |
| Deterministic design detector | Impeccable detector | 0 findings | High for detector rules only |

### Real PDF result

The real file `fictional_residential_lease_agreement.pdf` is 126,064 bytes and contains four readable pages. The live multipart API response reported:

- `ok: true`
- `stage: completed`
- content type `application/pdf`
- 4 pages
- 16,211 extracted characters
- `coverageStatus: complete`
- high deterministic risk band
- 4 potential red flags
- 5 renter questions

The corrupt PDF returned HTTP 422 with `extraction_failed` and `Failed to extract text from this PDF.` A subsequent valid request succeeded, confirming server-side recovery after a failed extraction.

The visible upload path was also completed end to end on `http://localhost:3000/`: the file chooser accepted the same PDF, the UI reported 123 KB and four pages, the Texas confirmation enabled the primary action, and analysis could be submitted. The initial `127.0.0.1` attempt was affected by the Next.js development server's origin/HMR restrictions; this was an audit-environment issue, not treated as a product defect.

### Failure-recovery result

With a confirmed real PDF loaded, the local service was deliberately stopped before submission. The interface returned to intake with `We couldn't finish analysis`, displayed `Failed to fetch`, stated that the lease text had not changed, and offered `Try again` plus `Paste Lease Text Instead`. Input preservation and recovery choices are good. Focus remained on the page root rather than moving to or announcing the error. Restarting the development server forced a development HMR reload and cleared client state, so retry-after-service-restoration remains only partially verified in the live session.

### Download result

The focused export suite passed 24 tests across report and checklist generation. Live clicks also created `sample-lease.txt-report (1).md` (7,481 bytes, 133 lines) and `beforeyousign-checklist (1).md` (5,039 bytes, 87 lines) in the Downloads folder. Both files existed and contained their expected report/summary or question content. This verifies delivery in the audited in-app browser session, but it is not a cross-browser result.

## 4. Step-by-step flow audit

| Step | Description | General health | Evidence-backed notes |
|---:|---|---|---|
| 1 | Discover the product and choose a review path | **Good** | Strong headline, clear sample/upload choices, responsible limitation copy. |
| 2 | Choose rental state | **Good** | Visible label and plain explanation. State-specific coverage is disclosed early. |
| 3 | Add a PDF, paste text, or select a sample | **Good** | The real four-page PDF attached successfully and the UI showed file size, page count, and readiness. File type and size validation exist. |
| 4 | Confirm document and jurisdiction | **Good** | Explicit checkbox prevents accidental analysis and explains state scope. |
| 5 | Wait for analysis | **Good with accessibility risks** | Progress is reassuring, but there is no cancel action and animation handling is incomplete. |
| 6 | Recover from a failure | **Partial** | A forced live network failure produced a clear error and preserved intake. UI offers retry and paste alternatives, but the panel is not an alert/live region, focus is not moved to it, and retry after service restoration was disrupted by the development server reload. |
| 7 | Arrive at completed report | **Poor** | `Lease intake` remains dominant. There is no strong success transition, and mobile users reach the report only after stale confirmation/source content. |
| 8 | Review source and guidance side by side | **Poor in newest work** | The requested 70vh became 70% width. At 1440px, source receives ~739px and report ~285px. |
| 9 | Navigate report sections | **Needs major accessibility work** | Nine dots do not form a meaningful visible map. Inactive slides remain focusable and exposed to assistive technology. |
| 10 | Open evidence for a finding | **High-risk** | The interaction is powerful when correct, but navigation can desynchronize and a guest-limit finding highlighted maintenance text. |
| 11 | Download report and checklist | **Verified in audited browser** | Export generators pass focused tests, and both live downloads produced readable Markdown. Buttons remain only 40px high. |
| 12 | Use at 200% zoom/equivalent reflow | **Viewport reflow passes; actual zoom needs manual confirmation** | At a 640px effective viewport, both landing and completed report showed no document-level horizontal overflow. The mobile hierarchy remains inefficient. |

## 5. Visual evidence

### Desktop report after the wrong-axis change

![Desktop report with source at 70 percent width](C:/Users/Chimdumebi/.codex/visualizations/2026/09/19/01a0bb86-213c-7c91-9369-ef4d5db8f3b4/beforeyousign-ui-audit/desktop-70-width-report.png)

The source is readable, but the primary guidance becomes a narrow, highly wrapped column with its own scrollbar. The visual hierarchy says the raw contract matters more than the product's interpretation.

### Mobile report arrival

![Mobile report buried beneath intake and source](C:/Users/Chimdumebi/.codex/visualizations/2026/09/19/01a0bb86-213c-7c91-9369-ef4d5db8f3b4/beforeyousign-ui-audit/mobile-report-buried.png)

The completed report is not visible in the first result viewport. The page still communicates intake rather than completion.

### Mobile evidence jump

![Mobile evidence jump separating the user from the finding](C:/Users/Chimdumebi/.codex/visualizations/2026/09/19/01a0bb86-213c-7c91-9369-ef4d5db8f3b4/beforeyousign-ui-audit/mobile-evidence-jump.png)

Evidence selection moves the user into the source viewer, above the report, without a persistent `Back to finding` control.

## 6. UX heuristic scorecard

| # | Heuristic | Score | Main reason |
|---:|---|---:|---|
| 1 | Visibility of system status | 3/4 | Analysis progress is clear; completion lacks an equally clear transition. |
| 2 | Match between system and real world | 3/4 | Most language is renter-focused; `Pattern scan` and badge-heavy status language feel internal. |
| 3 | User control and freedom | 2/4 | No cancel action; `Back to landing` does not warn that the report will be lost. |
| 4 | Consistency and standards | 3/4 | Consistent styling, but carousel and nested scrolling are unconventional for a high-stakes report. |
| 5 | Error prevention | 3/4 | State confirmation and limits are strong; jurisdiction validation remains largely the user's burden. |
| 6 | Recognition rather than recall | 3/4 | Current section is named, but nine dots provide no visible map and evidence jumps lose context. |
| 7 | Flexibility and efficiency | 2/4 | Multiple intake paths help; nine-section carousel slows scanning and comparison. |
| 8 | Aesthetic and minimalist design | 2/4 | Completed state retains intake chrome, dense report controls, downloads, details, and repeated caveats. |
| 9 | Error recognition and recovery | 3/4 | Errors preserve the intake and offer recovery, but focus/status announcement is weak. |
| 10 | Help and documentation | 3/4 | Strong inline guidance; help and caveats compete with the central report. |
|  | **Total** | **27/40** | **Acceptable; completed-report improvements are significant.** |

## 7. Technical audit scorecard

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 2/4 | Inactive slide controls, tiny targets, low contrast, nested landmarks, weak status announcement. |
| Performance | 3/4 | All rich report slides remain mounted; no severe runtime issue was observed. |
| Responsive design | 3/4 | Landing/mobile reflow works; the wrong width and breakpoint discontinuity damage desktop/tablet. |
| Theming | 2/4 | 245 hard-coded hex usages across 14 scoped files bypass existing tokens. |
| Implementation integrity | 3/4 | Coherent product-specific flow, but evidence mismatch and width regression are significant. |
| **Total** | **13/20** | **Acceptable; significant work needed.** |

## 8. Detailed findings

### P1 — `70vh` requirement implemented as 70% width

- **Location:** `src/components/beforeyousign/landing-client.tsx:314`
- **Category:** Responsive design / implementation integrity
- **Impact:** The report becomes the least readable part of the completed experience even though it contains the product's primary value.
- **Evidence:** Approximately 739px source / 285px report at a 1440px viewport.
- **Recommendation:** Remove `lg:w-[70%] lg:max-w-[70%]`. Apply `h-[70vh]` or `max-h-[70vh]` to the intended lease viewer/scroll region. Restore the previous horizontal balance or enforce a 420–480px minimum report width.
- **Acceptance criteria:** At desktop and tablet widths, the report never falls below its readable minimum; the lease viewer is 70vh high; 1024/1023 does not produce a jarring layout collapse.
- **Suggested command:** `$impeccable layout`

### P1 — Evidence navigation can show an inconsistent section/source state

- **Location:** `src/components/beforeyousign/lease-report.tsx:129-139`
- **Category:** Implementation integrity / accessibility
- **Impact:** Users may believe a quote supports a finding when the selected carousel section and visible content disagree.
- **Cause hypothesis:** Embla transforms the slide track, then `scrollIntoView` also changes the viewport's native horizontal `scrollLeft`.
- **Recommendation:** Prevent horizontal native movement during evidence jumps, reset native scroll before Embla navigation, and move focus to a stable evidence heading without altering inline position.
- **Acceptance criteria:** Selected section label, visible slide, selected finding, and highlighted quote always agree after mouse, touch, and keyboard activation.
- **Suggested command:** `$impeccable harden`

### P1 — A tested finding highlighted unrelated lease language

- **Location:** Rule/fallback classification around `src/lib/analysis/fallback-report.ts` and evidence indexing
- **Category:** Implementation integrity / trust
- **Impact:** `Guest limits may need review` highlighted maintenance/structural-repair language. This undermines the core trust promise.
- **Recommendation:** Add deterministic finding-to-quote assertions for every category. Never render `Found in lease` when the supporting quote does not contain a category-relevant signal.
- **Acceptance criteria:** Guest, pet, maintenance, fee, renewal, notice, utility, and entry findings each link only to matching evidence; unmatched findings are clearly labeled as general guidance.
- **Suggested command:** `$impeccable harden`

### P1 — Completed results are buried beneath stale intake state

- **Location:** Completed branch in `src/components/beforeyousign/landing-client.tsx`
- **Category:** UX / responsive / accessibility
- **Impact:** Users finish the hard task but still see `Lease intake`. Mobile users must pass confirmation, back action, and source viewer before reaching guidance.
- **Recommendation:** Replace the intake form with a compact document receipt, move focus to `Analysis complete` / `Your lease review`, and show report summary before source text on mobile.
- **Acceptance criteria:** On success, the report heading is visible and focused/announced; mobile users see the summary in the first result viewport; source text is available through a collapsed control.
- **Suggested command:** `$impeccable onboard`

### P1 — Carousel exposes inactive slides and undersized controls

- **Location:** `src/components/beforeyousign/lease-report.tsx:192` and `:279-289`
- **Category:** Accessibility / responsive
- **Impact:** Initial measurement found 19 tabbable controls outside the selected slide. Pagination targets were approximately 8×8px.
- **WCAG:** 2.1.1 Keyboard, 2.4.3 Focus Order, 2.5.8 Target Size (Minimum)
- **Recommendation:** Apply `inert` and `aria-hidden` to inactive slides, move focus to the active heading, and wrap each dot in a 44×44px target. Consider a labeled mobile section selector.
- **Acceptance criteria:** Only active-slide controls are tabbable/exposed; every navigation control has a minimum 24×24 WCAG target and preferably 44×44 product target; focus follows section changes predictably.
- **Suggested command:** `$impeccable adapt`

### P2 — Errors are visible but may not be announced

- **Location:** `src/components/beforeyousign/landing-client.tsx:378-410`
- **Category:** Accessibility / error recovery
- **Impact:** The error card has clear text and recovery choices, but no `role="alert"`, `aria-live`, or focus management. A screen-reader user may remain on the submission control without learning that analysis failed.
- **WCAG:** 3.3.1 Error Identification, 4.1.3 Status Messages, potentially 2.4.3 Focus Order
- **Recommendation:** Make the error summary an assertive status or focus a programmatically focusable heading. Preserve the current specific error and recovery copy.
- **Acceptance criteria:** Failure is announced once; focus does not become trapped; `Try again` and alternative input actions have clear names.
- **Suggested command:** `$impeccable harden`

### P2 — Small muted text misses contrast targets

- **Location:** `src/components/beforeyousign/analysis-in-progress.tsx:190`, `lease-text-viewer.tsx:438`
- **Category:** Accessibility / theming
- **Evidence:** `#9ca3af` on white measured 2.54:1; `#757682` on `#f2f4f6` measured 4.08:1 at small sizes.
- **WCAG:** 1.4.3 Contrast (Minimum)
- **Recommendation:** Replace with semantic muted tokens that remain at least 4.5:1 on actual surfaces.
- **Suggested command:** `$impeccable colorize`

### P2 — Nested `main` landmarks make navigation ambiguous

- **Location:** `landing-shell.tsx:19`, `landing-client.tsx:229`, and analysis state structure
- **Category:** Accessibility
- **Impact:** Screen-reader main-landmark navigation can expose more than one nested main region.
- **WCAG:** 1.3.1 Info and Relationships
- **Recommendation:** Keep the shell as the single `main`; use labeled `section` elements inside it.
- **Suggested command:** `$impeccable audit`

### P2 — Mobile evidence review creates three scroll contexts

- **Category:** UX / responsive / accessibility
- **Impact:** Page scroll, source scroll, and slide scroll compete. Evidence selection moves users away from the finding with no persistent return route.
- **Recommendation:** Use natural flow on mobile or show evidence inline/in a bottom sheet with `Back to finding`. Preserve both source and report positions.
- **Suggested command:** `$impeccable adapt`

### P2 — Reduced-motion handling is incomplete

- **Location:** `landing-client.tsx:91`, `analysis-in-progress.tsx:103` and `:241`
- **Category:** Accessibility
- **Impact:** Smooth scrolling and repeating ping effects remain active even though the carousel already has a reduced-motion precedent.
- **WCAG:** 2.3.3 Animation from Interactions where applicable
- **Recommendation:** Use instant scrolling under reduced motion, disable decorative ping, and preserve progress state changes without continuous interpolation.
- **Suggested command:** `$impeccable animate`

### P2 — Download actions are below the preferred touch-target size

- **Location:** `src/components/beforeyousign/download-markdown-button.tsx`
- **Category:** Accessibility / responsive
- **Impact:** Download buttons are 40px high rather than the product audit's 44px target.
- **Recommendation:** Increase to `h-11` and retain the visible label/icon pairing.
- **Suggested command:** `$impeccable adapt`

### P2 — No cancel action during analysis

- **Category:** UX / user control
- **Impact:** A distracted or mobile user can feel trapped during the estimated analysis period.
- **Recommendation:** Offer `Cancel analysis` that aborts the request and returns to the preserved intake without discarding the chosen document.
- **Suggested command:** `$impeccable harden`

### P2 — Theme tokens are bypassed throughout the flow

- **Category:** Theming / implementation integrity
- **Evidence:** 245 hard-coded hex occurrences across 14 scoped files while light and dark tokens already exist.
- **Impact:** Palette changes and dark-mode activation can produce inconsistent surfaces and contrast.
- **Recommendation:** Map report/intake colors to semantic tokens and decide whether dark mode is supported or should be removed from the contract.
- **Suggested command:** `$impeccable document`

### P3 — The visual system is clean but category-interchangeable

- **Category:** Design specificity
- **Impact:** Pale gradient, rounded white cards, pills, navy CTA, and generic sans-serif hierarchy resemble many AI document tools.
- **Recommendation:** Build identity around trustworthy contract annotation, editorial marginalia, evidence marks, and a recognizable review-desk metaphor.
- **Suggested command:** `$impeccable bolder`

### P3 — The ending lacks a confident action plan

- **Category:** UX / content hierarchy
- **Impact:** The experience ends with downloads and repeated caveats rather than a clear sense of closure.
- **Recommendation:** End with `Review ready` and a prioritized three-step checklist before secondary downloads and legal details.
- **Suggested command:** `$impeccable clarify`

## 9. Accessibility and screen-reader assessment

### Confirmed strengths

- The state selector has a visible label.
- Intake tabs expose a tablist/tab/tabpanel relationship and implement roving keyboard intent.
- Upload, sample, confirmation, FAQ, and carousel controls have accessible names.
- Decorative SVG icons are hidden from assistive technology.
- Analysis progress includes live-status semantics in parts of the flow.
- Error recovery retains the user's intake rather than silently clearing it.

### Confirmed risks

- Inactive carousel slides remain exposed to keyboard and accessibility navigation.
- Error completion, successful completion, and evidence jumps lack consistent focus/announcement behavior.
- Nested main landmarks create ambiguous page structure.
- Small muted text fails contrast at its rendered size.
- Tiny carousel dots create a severe target-size problem.
- Visual highlighting is not paired with a dependable announcement of the selected quote and location.

### Real screen-reader limitation

Windows Narrator is installed at `C:\WINDOWS\system32\Narrator.exe`; NVDA and JAWS were not present or running. The available automation surface exposed only the browser and did not provide native-app control or spoken-output capture, so Narrator could not be launched and verified responsibly. The browser accessibility tree was inspected, but it is not a substitute for a real screen-reader session.

Required manual follow-up:

1. Narrator + Edge or NVDA + Chrome at desktop width.
2. Read by landmarks and headings from the landing page through report completion.
3. Navigate the intake tabs, confirmation, carousel, evidence links, downloads, and error recovery entirely by keyboard.
4. Confirm success/error announcements occur once and focus lands in the intended place.
5. Confirm inactive slides and their controls are absent from the virtual cursor.

## 10. 200% zoom and responsive reflow

At a 1280px baseline, a 640px CSS viewport was used as the 200%-zoom reflow equivalent. The landing page had no document-level horizontal overflow (`scrollWidth 625` for a 640px viewport), and the hero, CTAs, state field, and intake card stacked cleanly. The completed report was then re-entered at the same viewport: it also reported `scrollWidth 625`, no horizontal overflow, and retained all report controls in the accessibility tree.

The viewport-equivalent result does not replace one final real browser-zoom pass after the layout correction because:

- the current wrong-width change activates at `lg` and radically changes the report around the breakpoint;
- the completed mobile layout already buries the report beneath source content;
- internal slide/source scrolling may behave differently from document-level reflow;
- actual browser text zoom could expose clipping that a narrow viewport alone does not.

## 11. Cognitive load and emotional journey

### Cognitive load

Five of eight checklist areas fail in the report:

- **Single focus:** intake confirmation, source, report, downloads, details, and caveats compete.
- **Chunking:** nine sections combine findings, badges, explanations, quotes, and actions.
- **Visual hierarchy:** stale intake and the wide source dominate the guidance.
- **Minimal choices:** carousel arrows, dots, cards, evidence actions, downloads, and disclosures appear without a recommended route.
- **Working memory:** evidence jumps separate the user from the finding they were reading.

Grouping, progressive disclosure, and one-slide-at-a-time presentation remain useful strengths.

### Emotional journey

- **Landing:** calm and credible.
- **Confirmation:** controlled and reassuring.
- **Analysis:** reassuring progress, with a small loss of control because there is no cancel action.
- **Report arrival:** the main emotional valley; the interface does not clearly say the review is ready.
- **Evidence highlight:** the emotional and trust peak when it is correct.
- **Ending:** useful but overly caveat-heavy and without a confident next-step summary.

## 12. Persona red flags

### Jordan — first-time renter

- `Lease intake` remains dominant after analysis.
- `Pattern scan`, attention bands, and multiple badges require interpretation.
- Risk language can feel alarming before the action is clear.

### Sam — accessibility-dependent renter

- Inactive slide controls remain in the navigation order.
- Tiny dots and small muted text create motor and low-vision barriers.
- Error, completion, evidence, and section changes need dependable announcements.

### Casey — mobile and distracted renter

- The report appears below stale intake/source content.
- Three scroll regions make context fragile.
- Selecting evidence provides no persistent return route.
- Refreshing the page loses the locally held review.

## 13. Planning-ready workstreams

### Workstream A — Correctness and trust gate

**Scope:** evidence classification, quote mapping, carousel/source synchronization.
**Priority:** P1; complete before visual polish.

Acceptance criteria:

- Every rendered `Found in lease` claim has category-relevant supporting text.
- Evidence clicks keep section heading, active slide, selected finding, and source highlight synchronized.
- Finding-to-quote regression fixtures cover every supported category.
- Unmatched guidance is labeled clearly and never presented as extracted evidence.

### Workstream B — Implement the intended 70vh layout

**Scope:** restore horizontal allocation and apply 70vh to the intended viewer.
**Priority:** P1.

Acceptance criteria:

- Lease viewer/scroll region is 70vh on the intended desktop state.
- Report keeps at least 420–480px readable width.
- Tablet transition is continuous and does not abruptly create a 285px report.
- Mobile summary precedes collapsed source text.

### Workstream C — Post-analysis information architecture

**Scope:** success handoff, report-first hierarchy, mobile ordering, closure.
**Priority:** P1.

Acceptance criteria:

- Success replaces stale intake controls with a compact document receipt.
- `Analysis complete` / `Your lease review` is visible and announced.
- First result viewport communicates top risks and recommended actions.
- Experience ends with a prioritized three-step checklist.

### Workstream D — Accessibility foundation

**Scope:** carousel exposure, focus management, live regions, landmarks, targets, contrast, reduced motion.
**Priority:** P1/P2.

Acceptance criteria:

- One `main` landmark.
- Inactive slides are inert and hidden from assistive technology.
- Status/error/success/evidence events have explicit announcement and focus behavior.
- All primary controls reach 44×44px product target; WCAG minimum is never missed.
- Normal text meets 4.5:1 contrast.
- Reduced-motion mode preserves state without decorative or disorienting motion.
- Narrator and NVDA manual passes complete with documented outcomes.

### Workstream E — Failure and export hardening

**Scope:** chooser validation, retry behavior, corrupt/scanned PDF states, download delivery.
**Priority:** P2.

Acceptance criteria:

- Wrong type, oversized PDF, corrupt PDF, scanned/no-text PDF, network loss, and server error each have a specific recovery path.
- Retry preserves the selected document and confirmation where safe.
- Report and checklist download correctly in Chrome, Edge, Safari, and Firefox.
- Export buttons meet touch-target requirements and filenames remain sanitized.

### Workstream F — Design-system consolidation

**Scope:** tokens, report navigation pattern, product-specific visual identity.
**Priority:** P2/P3 after structural work.

Acceptance criteria:

- Report/intake colors use semantic tokens.
- Dark-mode contract is either completed or intentionally removed.
- Report navigation is a labeled outline or an accessible carousel with a visible map.
- Visual language reinforces contract review and evidence annotation rather than generic AI SaaS styling.

## 14. Recommended implementation sequence

1. **[P1] `$impeccable harden`** — Fix evidence correctness and carousel/source synchronization first.
2. **[P1] `$impeccable layout`** — Replace the accidental 70% width with the intended 70vh viewer and restore report readability.
3. **[P1] `$impeccable onboard`** — Redesign the analysis-complete handoff and report-first hierarchy.
4. **[P1] `$impeccable adapt`** — Make carousel, mobile evidence flow, breakpoints, targets, and 200% reflow robust.
5. **[P2] `$impeccable audit`** — Re-run code-level accessibility checks after the structural changes.
6. **[P2] `$impeccable animate`** — Complete reduced-motion behavior.
7. **[P2] `$impeccable colorize`** — Correct contrast and migrate critical UI colors to semantic tokens.
8. **[P2] `$impeccable document`** — Consolidate the design-token contract.
9. **[P3] `$impeccable bolder`** — Strengthen the contract-annotation visual identity.
10. **[P3] `$impeccable polish`** — Final desktop/mobile/browser and assistive-technology QA.

## 15. Evidence limits and verification gaps

- The actual PDF was attached through the visible chooser and analyzed successfully through the multipart endpoint. Drag-and-drop remains unverified.
- Download content and live delivery were verified in the in-app browser; Chrome, Edge, Safari, and Firefox still need explicit coverage.
- The 200% viewport-equivalent check passed on both landing and completed report; actual browser text zoom and the corrected 70vh layout still need retesting.
- A real screen-reader session could not be captured because only the browser surface was controllable. Narrator is installed, but spoken output and native focus could not be verified.
- Real upload drag-and-drop, oversized file handling, scanned image-only PDFs, external resource links, full retry after service restoration, refresh recovery, and cross-browser behavior remain unverified.

## 16. Final audit verdict

BeforeYouSign is strongest where it is most product-specific: renter-oriented interpretation, responsible limitation copy, and evidence traceability. The early flow is credible and well structured. The current report experience is not release-ready because the newest work applies the 70% requirement to the wrong dimension, the evidence navigation can disagree with itself, and the accessible reading/focus model does not match what is visually active.

The plan should begin with correctness and hierarchy, not aesthetic polish. Fix the evidence contract, implement the intended 70vh viewer, then rebuild the post-analysis handoff and accessibility model around a report-first experience. Only after those structural issues are stable should the team invest in tokens, motion, and a more distinctive visual identity.

## 17. Controlled-demo release verification record

Updated 2026-10-03 after the remediation audit. Automated axe, keyboard, focus, reduced-motion, responsive, and target-size coverage is implemented in the Playwright suite. Automated coverage is not a substitute for spoken-output verification.

| Environment | Tester | Date | Result | Notes |
|---|---|---|---|---|
| Automated Playwright browser coverage | Codex test runner | 2026-10-03 | Implemented; execution recorded in the remediation PR | Covers critical landing, intake, progress, result, evidence, error, retry, and download-adjacent states. |
| Narrator + Edge | _Pending human tester_ | _Pending_ | **Required before release** | Verify reading order, status announcements, result-heading focus, evidence navigation, errors, retry, and downloads. Record Windows, Edge, and Narrator versions. |
| NVDA + Chrome | _Pending human tester_ | _Pending_ | **Required before release** | Verify the same journey and record Windows, Chrome, and NVDA versions. |

The controlled demo must not be described as assistive-technology verified until both pending rows contain real tester, version, outcome, and issue-resolution details.
