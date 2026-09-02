---
name: Scholar-Safe Analysis
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f88'
  primary: '#002045'
  on-primary: '#ffffff'
  primary-container: '#1a365d'
  on-primary-container: '#86a0cd'
  inverse-primary: '#adc7f7'
  secondary: '#695f02'
  on-secondary: '#ffffff'
  secondary-container: '#f2e580'
  on-secondary-container: '#6f650a'
  tertiary: '#271a39'
  on-tertiary: '#ffffff'
  tertiary-container: '#3d2f50'
  on-tertiary-container: '#a997be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#adc7f7'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#2d476f'
  secondary-fixed: '#f2e580'
  secondary-fixed-dim: '#d5c867'
  on-secondary-fixed: '#201c00'
  on-secondary-fixed-variant: '#4f4800'
  tertiary-fixed: '#eddcff'
  tertiary-fixed-dim: '#d2bfe8'
  on-tertiary-fixed: '#221534'
  on-tertiary-fixed-variant: '#4f4062'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  note-text:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '450'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1120px
  gutter: 1.5rem
  section-gap: 5rem
  card-padding: 2rem
  annotation-offset: 1rem
---

## Brand & Style

The brand personality is that of a "wise upperclassman"—knowledgeable and protective, yet approachable and empathetic. It bridges the gap between the intimidating complexity of legal Texas residential leases and the practical needs of students. 

The design style is **Modern SaaS with a Tactile Twist**. It leverages a clean, high-utility layout (inspired by document editors like Balsa) but softens the technical edge with "sticky note" annotations. This approach creates a mental model of a physical document being reviewed by a human expert. 

Crucially, the UI avoids "panic-inducing" aesthetics. There are no red warning icons, gavels, or aggressive risk meters. Instead, it uses "Review Priority" indicators to suggest caution without causing anxiety, maintaining a tone that is playful yet serious about the user's legal protection.

## Colors

This design system uses a high-clarity light mode default to mimic the feel of paper and professional documentation.

- **Primary (Deep Blue):** Used for core branding, primary actions, and authoritative text. It conveys trust and stability.
- **Annotation Palette:** Three distinct soft colors are used exclusively for "sticky note" callouts and lease highlights.
    - **Soft Yellow (#fef08a):** General observations and neutral explanations.
    - **Light Purple (#e9d5ff):** Clarifications on responsibilities (e.g., utility splits).
    - **Soft Blue (#bae6fd):** Helpful tips or negotiation suggestions.
- **Review Priority:** Use monochromatic shades of the Primary Blue or Neutral Slate to indicate priority levels. Avoid Red to prevent "warning fatigue" for the student user.

## Typography

The system relies on **Inter** for its maximum legibility and neutral, modern character. 

- **Hierarchy:** Headlines use tighter letter spacing and heavier weights to create a strong visual anchor.
- **Readability:** Body text is set with a generous line height (1.6) to prevent eye strain during long-form lease reading.
- **Annotation Typography:** The `note-text` role is specifically for sticky-note callouts, using a slightly smaller size but maintaining a medium weight to ensure legibility against colored backgrounds.
- **Mobile Scaling:** On devices smaller than 768px, `display-lg` should downscale to 32px and `headline-lg` to 24px.

## Layout & Spacing

The layout philosophy is **Document-Centered**. Content is primarily housed in a central column that mimics the width of a standard A4 or US Letter page, providing a familiar reading experience.

- **Grid:** A 12-column grid is used for the landing page, but the analysis dashboard utilizes a "Main + Sidebar" or "Overlaid Notes" model.
- **Margins:** Generous horizontal margins (minimum 24px on mobile) ensure the interface feels "airy" and approachable.
- **Annotations:** Sticky notes are positioned with a consistent `annotation-offset` from the main text block, often overlapping slightly to create a layered, tactile feel.
- **Responsive Behavior:** On tablet/mobile, annotations move from the side of the text to an expandable accordion or "drawer" format below the relevant clause to maintain readability.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layers** and **Ambient Shadows**.

- **The Document Base:** The main lease text sits on a flat white surface with a very subtle 1px border (#e2e8f0).
- **Sticky Notes:** These use a medium, diffused shadow with a slight color tint matching the note's background (e.g., a soft yellow note has a 10% opacity amber shadow). This makes them appear "peeled" off the page.
- **Cards & Modals:** Use a large, soft shadow (blur: 20px, opacity: 5%) to create a sense of floating importance without looking "heavy."
- **Interactive States:** Buttons and interactive cards subtly "lift" (increase shadow spread) on hover to encourage engagement.

## Shapes

The shape language is friendly and "bubbly" to counter the rigid nature of legal documents.

- **Cards:** Use `rounded-2xl` (1rem) for all primary containers and analysis cards.
- **Sticky Notes:** Use a slightly smaller radius (0.75rem) with one corner occasionally "folded" or sharper to reinforce the paper metaphor.
- **Buttons:** Fully rounded (pill-shaped) for primary CTAs to distinguish them clearly from document sections.
- **Input Fields:** `rounded-lg` (0.5rem) to maintain a professional SaaS feel while remaining soft.

## Components

### Buttons
- **Primary:** Deep Blue (#1a365d) background with white text. Pill-shaped.
- **Secondary:** White background, Deep Blue border (2px). Pill-shaped.
- **Ghost:** No background/border, Deep Blue text. Used for less critical actions like "View Source."

### Sticky Notes (Annotations)
- Rectangular with rounded corners.
- Backgrounds: Soft Yellow, Purple, or Blue.
- Top-left "Pin" or "Note" icon to denote the annotation type.
- These components should always appear "over" the main text content.

### Analysis Cards
- White background, `rounded-2xl`, with a subtle 1px border.
- Include a "Review Priority" tag at the top (Low, Medium, High) using the Primary color shades.
- Footer area for "Plain English" translation vs. "Original Clause."

### Clause Highlighter
- Semi-transparent background colors matching the sticky notes.
- Rounded caps on the highlight selection to match the overall system roundedness.

### Progress Indicators
- Simple, thin horizontal bars in Deep Blue. Avoid circular "score" gauges that look like grades or risk ratings.