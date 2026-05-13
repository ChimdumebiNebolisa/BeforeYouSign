# BeforeYouSign

**BeforeYouSign** is a Next.js app for reviewing residential leases. You can upload a PDF, paste lease text, or use built-in samples. Analysis runs on the server with **Google Gemini** and returns structured findings (fees, notices, risk signals, and more).

---

## What you need

- **Node.js** (current LTS is a good choice)
- **npm**

---

## Where things live

The Next.js app is at the **repository root** (`BeforeYouSign/`). Run every `npm` command from this folder—there is no nested app directory.

---

## Run it locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` from the example file:

- **Windows (cmd):** `copy .env.local.example .env.local`
- **macOS / Linux:** `cp .env.local.example .env.local`

Then set your variables (see [Environment variables](#environment-variables) below).

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

Set these in **`.env.local`** (server-side only).

| Variable           | Required | Notes |
|--------------------|----------|--------|
| `BYS_AI_KEY`       | Yes      | Google AI API key. |
| `BYS_GEMINI_MODEL` | No       | Defaults to `gemini-2.5-flash` if omitted. |

Do **not** use the `NEXT_PUBLIC_` prefix for these values—they must never be bundled for the browser.

---

## Sample leases (no PDF required)

In the UI, use **Try Sample Lease** to load plain-text fixtures from `public/sample-leases/`:

| File             | What it exercises |
|------------------|-------------------|
| `standard.txt`   | Balanced rent, deposit, renewal, and notice language. |
| `fee-heavy.txt`  | Multiple fees and late/NSF-style charges. |
| `notice-heavy.txt` | Renewal and notice-period–heavy language. |

Useful for quick end-to-end checks without uploading a file.

---

## Optional: PDF extraction debug logs

Enables extra server-side logging while extracting text from PDFs.

**Windows (cmd)—set for the session, then start the app:**

```bat
set BEFOREYOUSIGN_PDF_DEBUG=1
npm run dev
```

**macOS / Linux:**

```bash
export BEFOREYOUSIGN_PDF_DEBUG=1
npm run dev
```

---

## npm scripts

| Command           | Purpose |
|-------------------|---------|
| `npm run dev`     | Development server with hot reload. |
| `npm run build`   | Production build. |
| `npm run start`   | Run the production server (after `build`). |
| `npm run lint`    | Run ESLint. |

---

## Architecture

High-level request flow from the browser through the single analyze route and back. There is **no database**: results exist only in client state after the response.

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
    GEM["gemini-report.ts — Gemini JSON schema"]
    RNORM["report-normalization.ts"]
    FALL["buildRuleOnlyFallbackReport"]
    OUT["JSON — pages, snippets, risk, report"]

    IN -->|multipart PDF| PDF
    IN -->|application/json| TXT
    PDF --> NORM
    TXT --> NORM
    NORM --> RULES
    RULES --> RISK
    RISK --> GEM
    GEM -->|parsed OK| RNORM
    GEM -->|timeout / parse / schema fail| FALL
    RNORM --> OUT
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
    GR["gemini-report.ts"]
    SCH["schema.ts"]
    MR["model-json.ts"]
    REP["report-normalization.ts"]
    PR["prompt.ts"]
  end

  RT --> EXT
  RT --> NOR
  RT --> RL
  RT --> SC
  RT --> GR
  GR --> SCH
  GR --> MR
  GR --> REP
  GR --> PR
```

**Notes**

- **`BYS_AI_KEY`**: If unset, the route still returns **snippets and deterministic risk**, but **`report` may be null** with a user-facing `reportError` string instead of a Gemini-produced report.
- **Paste/sample text** skips PDF extraction and is analyzed as a single virtual page.

---

## Stack (short)

Next.js (App Router), React, TypeScript, Tailwind CSS, Gemini (`@google/generative-ai`), PDF tooling (`pdf-parse`, `pdf-lib`).

For general Next.js topics (routing, deployment, etc.), see the [Next.js documentation](https://nextjs.org/docs).
