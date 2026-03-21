# Design System Strategy: The Informed Advocate

## 1. Overview & Creative North Star
The Creative North Star for this system is **"The Digital Curator."** 

In a sector plagued by dense, intimidating "Corporate Legal-tech" (cluttered dashboards, heavy borders, and aggressive blues), this system takes an editorial approach. It treats a lease not as a daunting legal document, but as a clear, navigable narrative. 

We break the "SaaS Template" look by prioritizing **intentional asymmetry** and **tonal depth**. Instead of rigid grids of equal-sized boxes, we use expansive white space and overlapping "glass" layers to guide the eye. The experience should feel like a premium concierge service—protective, calm, and sophisticated.

---

## 2. Color & Surface Philosophy
The palette is rooted in a "Low-Contrast High-End" philosophy. We move away from stark whites and harsh blacks to embrace a sophisticated blue-gray spectrum.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Traditional borders create visual noise that feels "engineered" rather than "designed."
- **How to section:** Use background shifts. Place a `surface-container-low` component on a `background` canvas.
- **The Result:** Boundaries are felt through weight and tone rather than drawn with lines.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
- **Base:** `background` (#f7f9fb)
- **Primary Content Areas:** `surface-container-low` (#f2f4f6)
- **Interactive Cards:** `surface-container-lowest` (#ffffff) for maximum "pop" and perceived cleanliness.
- **Nesting:** To highlight a specific clause within a lease analysis, place a `surface-container-highest` (#e0e3e5) small element inside a `surface-container-low` parent.

### The Glass & Gradient Rule
To achieve a "Signature" feel, use **Glassmorphism** for floating elements (headers, navigation bars, or floating action cards).
- **Formula:** `surface` color at 70% opacity + `backdrop-blur: 20px`.
- **CTAs:** Use a subtle linear gradient for `primary` actions, transitioning from `primary` (#00246a) to `primary_container` (#00389a) at a 135-degree angle. This adds "soul" and depth that flat hex codes lack.

---

## 3. Typography: Editorial Authority
We pair **Manrope** for high-level expression with **Inter** for utilitarian clarity.

- **Display & Headlines (Manrope):** Large, confident, and slightly tracked-in (-0.02em). Use `display-lg` for welcome states to create an "Editorial Cover" feel.
- **Titles & Body (Inter):** Highly legible. Use `title-md` for lease clause headers to ensure they feel authoritative but approachable.
- **Hierarchy as Protection:** High-risk analysis should use `headline-sm` to grab attention, while "Safe" clauses use `body-md` with `secondary` color tokens to feel calm and secondary.

---

## 4. Elevation & Depth
Depth is a functional tool, not a stylistic flourish. It represents the "weight" of information.

### Tonal Layering
Avoid shadows for static layout elements. A `surface-container-lowest` card on a `surface-container-low` background provides enough contrast for the eye to perceive a 2mm lift without any CSS shadow properties.

### Ambient Shadows
For elements that truly "float" (modals, dropdowns, or mobile navigation):
- **Spec:** `0px 20px 40px rgba(25, 28, 30, 0.06)`. 
- **The Logic:** We use the `on-surface` color (#191c1e) at a very low opacity (6%) rather than pure black to ensure the shadow feels like a natural part of the blue-gray environment.

### The "Ghost Border" Fallback
If contrast ratios fail or an element feels "lost," use a **Ghost Border**:
- **Token:** `outline-variant` (#c5c5d3) at **15% opacity**. It should be barely perceptible—a whisper of a boundary.

---

## 5. Signature Components

### Buttons (The "Call to Action")
- **Primary:** Gradient-filled (Primary to Primary-Container), `xl` (0.75rem) roundedness. No border.
- **Secondary:** `surface-container-highest` background with `on-surface` text.
- **Tertiary:** Pure text with `on-primary-fixed-variant` color. Use for "Cancel" or "Go Back."

### Lease Risk Chips
Avoid generic pill shapes. Use a slightly larger `md` (0.375rem) corner radius.
- **High Risk:** `error_container` background with `on-error_container` text.
- **Low Risk:** `secondary_fixed` background with `on-secondary_fixed_variant` text.

### The Analysis Card (Custom Component)
- **Constraint:** Strictly no dividers. 
- **Structure:** Use `spacing.6` (2rem) of vertical white space to separate the "Clause Text" from the "Legal Analysis." 
- **Layering:** The "Clause Text" sits in a `surface-container-highest` box to mimic the look of a physical document excerpt, while the analysis sits on the `surface-container-lowest` card base.

### Input Fields
- **State:** Inactive inputs should blend into the background using `surface-container-low`. 
- **Focus:** Transition to `surface-container-lowest` with a 1px `primary` ghost-border (20% opacity). This makes the field feel like it "lights up" when the user interacts.

---

## 6. Do's and Don'ts

### Do:
- **Use Asymmetry:** Place a large headline on the left with a smaller, glassy info-card overlapping it slightly on the right.
- **Embrace White Space:** Use `spacing.16` or `spacing.20` between major sections to let the "legal" weight breathe.
- **Color Context:** Use `primary_fixed` for background accents to create a soft, branded "wash" over a page.

### Don't:
- **No 100% Black:** Never use #000000. Use `on-surface` (#191c1e) for text to maintain the "Soft Minimalism" tone.
- **No Sharp Corners:** Avoid `none` or `sm` roundedness. Use `xl` (0.75rem) for cards and `full` for interactive chips to maintain the "Protective/Calm" personality.
- **No Dashboard Overload:** Avoid showing more than 3-4 data points at once. This is a "Curated" experience, not a data-mining tool.