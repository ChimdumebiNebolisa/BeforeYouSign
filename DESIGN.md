---
name: BeforeYouSign
description: A report-first lease review system where verified evidence leads.
colors:
  paper: "#f3f4f2"
  surface: "#ffffff"
  ink-navy: "#182133"
  primary-navy: "#16385f"
  primary-navy-raised: "#244c78"
  graphite: "#c6cac6"
  muted-paper: "#e9ebe8"
  muted-ink: "#4f5a69"
  evidence-blue: "#215fa8"
  evidence-paper: "#eaf2ff"
  link-blue: "#124f91"
  caution-amber: "#775500"
  caution-paper: "#fff4ce"
  success-green: "#17624b"
  success-paper: "#e9f6ef"
  destructive-red: "#a22636"
  destructive-paper: "#fff0f1"
  annotation-yellow: "#f4dc86"
  annotation-purple: "#dfd4ef"
  annotation-blue: "#c7ddf4"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.14em"
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.375
rounded:
  sm: "calc(0.75rem * 0.6)"
  md: "calc(0.75rem * 0.8)"
  lg: "0.75rem"
  xl: "calc(0.75rem * 1.4)"
  2xl: "calc(0.75rem * 1.8)"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2rem"
  3xl: "3rem"
  section-desktop: "5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-navy}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.xl}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.xl}"
    padding: "0 0.75rem"
    height: "2.75rem"
  status-pill:
    backgroundColor: "{colors.success-paper}"
    textColor: "{colors.success-green}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
---

# Design System: BeforeYouSign

## Overview

**Creative North Star: "The Annotated Lease Desk"**

BeforeYouSign feels like a careful review assembled on neutral paper: ink-navy hierarchy, graphite rules, evidence-blue references, and amber cautions. Verified lease evidence leads; the interface is a contract review, not a generic dashboard. Editorial labels, numbered sections, compact receipts, and source-linked annotations make the system feel exact without becoming severe.

The completed journey tells one story: choose a lease and state, run deterministic analysis, read the report first, verify exact source spans, then act or download. Its identity is intentionally light-only, calm, and dense enough for serious reading while retaining generous separation between decisions.

**Key Characteristics:**

- Report-first information hierarchy with source verification one deliberate action away.
- Neutral paper surfaces, thin graphite rules, and sparse semantic color.
- Manrope headlines paired with Inter body copy and Geist Mono for technical detail.
- Restrained radii, editorial annotations, and visible keyboard focus.
- Plain-language status, limitations, and recovery states that never rely on color alone.

**The Evidence-Leads Rule.** A conclusion may look grounded only when the exact lease span can be opened and verified.

**The Finish Rule.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Colors

The palette is mostly paper, ink, and graphite; blue identifies evidence and interaction, while amber, green, and red appear only for semantic meaning.

### Primary

- **Ink Navy:** Primary reading color and the high-contrast action-panel field.
- **Primary Navy:** Brand wordmark, primary actions, and emphasized navigation.

### Secondary

- **Evidence Blue:** Verified-source links, selection rings, focus, and exact-span highlights.
- **Caution Amber:** Review priority and terms requiring closer attention.
- **Success Green:** Completion and successful processing states.

### Neutral

- **Paper:** Page canvas with a subtle ruled-margin cue.
- **Surface:** Main report, source pages, controls, and elevated navigation.
- **Graphite:** Dividers and borders; structure is usually drawn, not shadowed.
- **Muted Paper / Muted Ink:** Receipts, technical panels, helper copy, and secondary metadata.

**The Sparse-Semantics Rule.** Never use evidence blue, caution amber, success green, or destructive red as decoration; each color must communicate a state or traceable action.

## Typography

**Display Font:** Manrope (with sans-serif fallback)

**Body Font:** Inter (with sans-serif fallback)
**Label/Mono Font:** Inter for editorial labels; Geist Mono for technical payloads

**Character:** Manrope provides compact authority for decisions and section headings. Inter carries long-form lease content with calm clarity; tracked uppercase labels behave like margin annotations rather than marketing eyebrow copy.

### Hierarchy

- **Display:** Completion and page-level outcomes only; desktop uses the display token, while mobile steps down to the headline scale.
- **Headline:** Report summaries and the most important reading landmarks.
- **Title:** Section headings, action blocks, and source-document headings.
- **Body:** Findings, explanatory copy, extracted lease text, and actions; keep prose comfortably scannable and avoid wide uninterrupted measure.
- **Label:** Receipt keys, page numbers, technical summaries, and small annotation headings; uppercase and tracked only for short metadata.
- **Mono:** Machine-oriented details inside the technical disclosure, never primary guidance.

**The Plain-Language Rule.** Visual authority comes from hierarchy and evidence, not legalistic typography or ornamental copy.

## Layout

The reusable page container tops out at 73.75rem and uses responsive side padding. The result surface starts with completion, a compact document/state/source receipt, review priority, and the first action. At the extra-large breakpoint, the reading area becomes a 3:2 report/source grid; the source remains sticky and independently scrollable. Below that breakpoint, the report remains first and the source follows as a collapsible panel.

Desktop report navigation is a numbered left rail beside the active section. Mobile replaces it with a full-width section select, keeps the receipt to three compact columns, stacks action downloads, and moves “Review another lease” to the end of the flow. Section rhythm moves from 3rem on small screens to 5rem from the medium breakpoint; dense report interiors use 0.5–2rem increments.

**The Report-First Rule.** Responsive changes may collapse or stack the source, but they must never place full source text before the report summary and first action.

## Elevation & Depth

The system is flat by default. Graphite borders, paper-tone changes, and inset semantic surfaces do most of the layering. A diffuse low shadow is reserved for the floating navigation and prominent intake panels; modals use one slightly stronger shadow. Sticky-note annotations may carry a small colored cast, while report sections remain ruled and shadowless.

**The Structural-Rule Rule.** Prefer a border or tonal change over a shadow for report structure; shadow signals floating context, not ordinary grouping.

## Shapes

Corners are restrained and functional: report interiors use small or medium rounding, fields and outer actions use the larger radius, and only compact statuses use pills. Major report sections often use square-ended top and bottom rules rather than card silhouettes. The main report shell and floating navigation use the largest established radius, but avoid nested stacks of rounded cards.

**The Editorial-Container Rule.** A section with readable content should first look like a ruled document region; reserve card shapes for controls, receipts, source viewers, disclosures, and state notices.

## Components

### Buttons

- **Primary:** Navy field, white label, medium weight, and a 44px minimum target for journey actions.
- **Outline:** White surface with graphite border for secondary or reversible actions.
- **Download:** White-on-navy-panel action with an inline download icon, small shadow, and strong navy label.
- **Hover / Focus:** Tonal hover only; focus is a 2px evidence-blue outline or ring with visible offset. Active controls may shift down by one pixel.

### Status Pills and Badges

- **Completion:** Success-paper pill with success-green text.
- **Priority:** Caution-paper pill containing both the “Review priority” label and its plain-language value.
- **Source / provenance:** Compact neutral badge; never imply verified evidence through badge text alone.

### Cards / Containers

- **Report shell:** Surface background, graphite border, largest radius, and no resting shadow.
- **Report sections:** Transparent or lightly tinted paper with horizontal rules.
- **Review-ready panel:** Full primary-navy field with numbered steps and download actions.
- **Technical and legal disclosures:** Muted paper or secondary surface with graphite border and compact type.

### Inputs / Fields

- **Style:** 44px minimum height, paper or white field, graphite stroke, larger control radius, and readable labels above.
- **Focus:** Evidence-blue ring with sufficient offset and no motion dependency.
- **Tabs:** Muted-paper group; the selected tab becomes a white inset surface with navy text and a subtle rule.

### Navigation

The global wordmark sits in a centered, floating white bar. Report navigation is content navigation: a numbered vertical rail on desktop and a labeled select on mobile. The active section uses evidence-paper with navy text; inactive items remain quiet until hover or focus.

### Evidence Viewer

The source viewer is the signature component. It pairs a compact file/page header with a scrollable white document, typographic parsing for headings and metadata, exact-span highlights, and a “Back to finding” return path. On mobile it is collapsed after the report; on desktop it occupies the source side of the 3:2 split.

## Do's and Don'ts

### Do:

- **Do** lead completed states with completion, receipt, priority, and a concrete next action.
- **Do** keep the report before the source at every viewport size.
- **Do** distinguish verified evidence, unsupported guidance, and legal limitations in words as well as color.
- **Do** preserve 44px interaction targets, visible focus, reduced-motion behavior, and readable reflow.
- **Do** attach provenance metadata to every raster that ships as design evidence.

### Don't:

- **Don't** turn the product into a dashboard, slide carousel, or equal-weight card grid.
- **Don't** use bright color, large shadows, gradients, or rounded containers as decoration.
- **Don't** let extracted source text visually outrank the renter-facing report.
- **Don't** present a conclusion as grounded unless its verified page, offsets, quote, and category relevance are available.
- **Don't** fabricate testimonials, legal outcomes, customer proof, or unsupported jurisdiction coverage.
