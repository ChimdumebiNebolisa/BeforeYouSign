# BeforeYouSign

## What this is

**BeforeYouSign** is a Next.js web app that helps renters review **residential lease** documents before signing. Users upload a PDF lease, paste plain text, or load sample lease fixtures. The server extracts text (when needed), runs **regex-based clause detection** and **deterministic risk scoring**, then builds a **structured report** (summary, fees, deadlines, red flags, suggested questions) from the lease text. Results display in the browser with evidence quotes tied to page-level extracted text.

## Problem it solves

Lease agreements are long and written in dense legal language. Renters often struggle to quickly spot **costs, notice and renewal rules, maintenance or utility responsibilities, and clauses worth questioning**. This project reduces that friction by highlighting likely pressure points and summarizing them in plain language, while staying **informational** (not legal advice).

## Features

- **PDF lease upload** with server-side text extraction (`pdf-parse`), plus **paste text** and **built-in sample leases** from `public/sample-leases/`.
- **Structured report UI**: carousel sections for summary, red flags, money and fees, deadlines, responsibilities, questions, next steps, and “not clearly stated” when applicable.
- **Evidence linking**: clicking report rows can scroll the **extracted text** viewer and highlight matching quotes by page (evidence ID-first when grounded).
- **Rule-based snippet extraction** (rent, deposit, fees, notice, renewal, maintenance, utilities, vague phrases) and **deterministic risk band** with reasons.
- **Deterministic narrative report** built from lease pattern matches and extracted text.
- **Analysis transparency** so users can see how the report was produced.
- **Full report Markdown export** (client-side download) plus existing question checklist export.
- **Transparency panel** (“How this was analyzed”) showing extraction counts, snippet hits, and heuristic risk signals.

See [docs/POLICYINSIGHT_EXTRACTION_AUDIT.md](docs/POLICYINSIGHT_EXTRACTION_AUDIT.md) for pattern-extraction decisions and deferred scope.

## Tech stack

**Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, Embla Carousel, Lucide icons, shadcn-style UI primitives (`src/components/ui/`).

**Backend:** Next.js Route Handler — `POST /api/analyze` (`src/app/api/analyze/`).

**Analysis:** Deterministic lease pattern matching and structured report assembly.

**Other tools:** `pdf-parse` + `pdf-lib` (`src/lib/pdf/`), ESLint (`npm run lint`), Playwright QA smoke scripts.

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/ChimdumebiNebolisa/BeforeYouSign.git
cd BeforeYouSign
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env.local` file in the root (you can start from `.env.local.example`):

**Windows (cmd):** `copy .env.local.example .env.local`
**macOS / Linux:** `cp .env.local.example .env.local`

Environment variables used:

```md
BYS_OCR_ENABLED: Set to 1 to enable the configured OCR adapter.
```

Optional for development:

```bat
set BEFOREYOUSIGN_PDF_DEBUG=1
```

(Unix: `export BEFOREYOUSIGN_PDF_DEBUG=1`) — enables extra PDF extraction logging on the server.

### 4. Run the app locally

```bash
npm run dev
```

Open the local URL shown in the terminal (typically [http://localhost:3000](http://localhost:3000)).

---

## How it works

For this project:

1. **Choose intake:** Upload a PDF, paste lease text, or load a sample file from the UI (`src/components/beforeyousign/`).
2. **Submit analysis:** The client sends **`POST /api/analyze`** — **multipart** (`file`) for PDFs or **JSON** (`leaseText`, optional `fileName`) for pasted/sample text (`landing-client.tsx`, `route.ts`).
3. **Prepare text:** PDFs are read per page via **`extractPdfTextPages`**; pasted text becomes a single synthetic page. All text passes **`normalizeLeasePageText`** (`src/lib/pdf/`).
4. **Deterministic pass:** **`rules.ts`** extracts snippet matches; **`scoring.ts`** computes a risk band and reasons; ambiguous phrases are flagged (`findUnclearLeasePhrases`).
5. **Build report:** **`buildRuleOnlyFallbackReport`** assembles the report from deterministic findings and extracted lease text.
6. **Render results:** JSON returns **`extractedPages`**, snippet arrays, deterministic risk fields, **`mode`**, and **`report`**. The client shows **`LeaseTextViewer`**, **`LeaseReportView`**, **`AnalysisModeBanner`**, and **`TechnicalDetailsPanel`** (`landing-client.tsx`).

## Architecture

Brief folder layout:

```txt
src/app/: App Router — layout, page, favicon/app icons, and POST /api/analyze.
src/components/beforeyousign/: Intake, report carousel, text viewer, loading shell.
src/components/ui/: Shared UI (e.g. Button).
src/lib/analysis/: Regex rules, scoring, deterministic report assembly, and normalization.
src/lib/pdf/: PDF extraction (pdf-parse) and text normalization.
public/: Static assets — sample leases, images.
```

System overview:

```txt
Frontend: React client components; single-page lease intake and results.
Backend: Next.js Route Handler (Node) — one analyze endpoint; no separate API server.
External services: none for lease analysis.
Deployment: Standard Next.js production build (npm run build && npm run start); host per your platform (e.g. Vercel-compatible).
```

High-level request flow — there is **no database**; results live in client state after the response.

### End-to-end flow

```mermaid
flowchart TB
  subgraph Client["Browser — React"]
    LC["LandingClient — intake"]
    V["LeaseTextViewer"]
    R["LeaseReportView"]
    T["TechnicalDetailsPanel"]
    LC --> V
    LC --> R
    LC --> T
  end

  subgraph Route["POST /api/analyze — src/app/api/analyze/route.ts"]
    IN{"Body type?"}
    PDF["extractPdfTextPages — pdf-parse"]
    TXT["JSON leaseText → normalize → 1 synthetic page"]
    NORM["normalizeLeasePageText"]
    RULES["rules.ts — snippet finders"]
    RISK["scoring.ts — deterministic band + reasons"]
    RNORM["report-normalization.ts"]
    FALL["buildRuleOnlyFallbackReport"]
    OUT["JSON — pages, snippets, risk, report"]

    IN -->|multipart PDF| PDF
    IN -->|application/json| TXT
    PDF --> NORM
    TXT --> NORM
    NORM --> RULES
    RULES --> RISK
    RISK --> FALL
    FALL --> OUT
  end

  LC -->|"fetch POST"| IN
  OUT -->|"response"| LC
```

### Key modules

```mermaid
flowchart LR
  subgraph api["API route"]
    RT["route.ts"]
  end

  subgraph pdf["PDF + text"]
    EXT["pdf/extract-text.ts"]
    NOR["pdf/normalize.ts"]
  end

  subgraph analysis["Analysis"]
    RL["rules.ts"]
    SC["scoring.ts"]
    SCH["schema.ts"]
    MR["model-json.ts"]
    REP["report-normalization.ts"]
    PR["prompt.ts"]
  end

  RT --> EXT
  RT --> NOR
  RT --> RL
  RT --> SC
  RT --> REP
```

**Notes**

- **Paste/sample text** skips PDF extraction and is analyzed as a single virtual page.

---

## Verification

Pull requests and pushes to `main` run CI for lint, typecheck, unit tests, coverage, deterministic evaluation, legal references, a production build, and Playwright browser tests against that production build. The separate QA syntax workflow also verifies the committed QA scripts parse successfully:

```bash
node --check scripts/phase2-scan-smoke.mjs
node --check scripts/smoke-test.mjs
node --check scripts/phase1-browser-qa.mjs
node --check scripts/phase2-browser-qa.mjs
```

Run unit tests and coverage (critical modules):

```bash
npm test
npm run test:coverage
npm run evaluate
npm run verify:legal
npm run build
npm run test:e2e
```

Run static linting:

```bash
npm run lint
```

Run the API scan smoke test against a running local server:

```bash
npm run dev
npm run smoke:scan
```

Run browser QA smoke checks against a running local server. Install Playwright browser binaries first if you have not run browser QA on this machine:

```bash
npx playwright install
```

```bash
npm run qa:smoke
npm run qa:phase1
npm run qa:phase2
```

The browser QA scripts use Playwright and write screenshots under `qa-screenshots/` for visual review.

---

## Known limitations

- **No user accounts or persisted reports** — refreshing loses in-session results unless the user runs analysis again.
- **Single synchronous HTTP request** — very large PDFs or slow model responses may hit hosting timeouts (`maxDuration` on the route is capped for serverless-style deployments).
- **PDF text extraction is not OCR** — scanned image-only PDFs may yield little or no extractable text.
- **Evidence highlighting** uses substring matching (`indexOf` on the quote); minor mismatches between model quotes and extracted text can prevent a highlight.
- **No persistent report recovery or background jobs** — analysis is a single synchronous request and results remain in browser state only.
