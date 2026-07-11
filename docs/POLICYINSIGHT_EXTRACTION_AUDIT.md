# PolicyInsight Pattern Extraction Audit

Audit date: 2026-07-11

## Reference commits inspected

| Repository | Branch | SHA |
|------------|--------|-----|
| BeforeYouSign | `main` → `feat/policyinsight-pattern-extraction` | `41faa02020dfe9904063fa36897f4c5a08ffcfc4` |
| PolicyInsight | `rebuild/simple-gemini-railway` | `348d7fbd9348e9c13c98852a98ef89f611650edc` |

PolicyInsight reference clone: `../policy-insight-reference` (read-only).

---

## Already present in BeforeYouSign

| Capability | Location |
|------------|----------|
| Stable evidence chunk IDs (SHA256) | `src/lib/evidence/segment.ts` |
| Evidence registry | `src/lib/evidence/registry.ts` |
| ID-only model grounding | `src/lib/analysis/ground-model-candidates.ts` |
| Deterministic rule-only fallback | `src/lib/analysis/fallback-report.ts` |
| Input size validation | `src/lib/analysis/limits.ts`, `validate-intake.ts` |
| Content-safe logging | `src/lib/observability/safe-analysis-events.ts` |
| Legal reference verification | `scripts/verify-legal-references.mjs`, `texas-renter-references.ts` |
| Feature flags | `src/lib/rollout/flags.ts` |
| Partial Markdown export (checklist) | `src/lib/checklist-export.ts` |
| Sample leases | `public/sample-leases/`, `public/samples/` |
| Gemini retry (schema strip) | `src/lib/analysis/gemini-report.ts` |
| Error taxonomy (runtime) | `AnalysisProblemCode` in `limits.ts` |
| OCR / async hooks (stubs) | `src/lib/ocr/`, `src/lib/jobs/` |
| Vitest unit + integration tests | `tests/unit/`, `tests/integration/` |

---

## Feature comparison and decisions

| PolicyInsight feature | BeforeYouSign equivalent | User value | Infra cost | Security/privacy | Complexity | Decision | Reason |
|----------------------|--------------------------|------------|------------|------------------|------------|----------|--------|
| Source chunking (1800 char windows) | Page-paragraph segmentation (`segment.ts`, max 800 chars) | High | None | Low | Low | **Adapt** | BYS page-based model fits leases; strengthen quote→chunk resolution |
| Citation validation (UUID filter) | `groundModelCandidates` drops invalid IDs | High | None | Low | Low | **Adapt** | Core exists; harden fallback path + UI highlight by ID |
| Report JSON schema | `BeforeYouSignReport` + Zod parsing | High | None | Low | — | **Keep** | Lease-specific schema is correct product scope |
| Job state enum (`JobStatus`) | String log stages only | Medium | None | Low | Low | **Implement** | Typed `AnalysisStage` for logging, errors, progress |
| Retry without re-extract | Full pipeline retry in UI | High | None | Low (browser cache) | Medium | **Implement** | `POST /api/analyze/retry-model` skips PDF extraction |
| Deterministic fallback + labeling | `buildRuleOnlyFallbackReport`, `AnalysisMode` | High | None | Low | Low | **Adapt** | Add user-visible mode banner |
| Markdown export (full report) | Checklist export only | Medium | None | Low | Low | **Implement** | `buildReportMarkdown` client download |
| Evidence sidebar + citation chips | Report slides + quote highlight | Medium | None | Low | Medium | **Adapt** | evidenceId-first highlight in lease text viewer |
| Integration test discipline | 13 unit + 2 integration tests | High | None | Low | Medium | **Implement** | API route tests + lease fixtures |
| PostgreSQL + Flyway | None | Low for MVP | High | Higher retention | High | **Reject** | Not needed for lease review without accounts |
| Persistent async jobs | In-memory stub (`BYS_ASYNC_ENABLED`) | Low | High | Medium | High | **Defer** | Sync pipeline sufficient |
| Owner cookies | None | Low | Medium | Medium | High | **Defer** | No account model |
| Expiring share links | Recovery stub (unwired) | Low | Medium | Higher | High | **Defer** | Out of renter MVP scope |
| Grounded Q&A | None | Low | Medium | Medium | High | **Defer** | Not lease-review critical path |
| Rate limiting (in-memory 10/min) | `acquireClientSlot` (concurrency=1) | Low | Low | Low | Low | **Defer** | Existing slot guard adequate |
| Scheduled retention cleanup | None | Low | Medium | Positive if wrong | Medium | **Defer** | No server-side document storage |
| Multi-document samples | Lease-specific samples only | N/A | — | — | — | **Reject** | Preserve lease focus |
| Spring Boot / Java stack | Next.js TypeScript | N/A | — | — | — | **Reject** | Framework not portable |

---

## Implemented in this pass

1. **Evidence hardening** — `resolveQuoteToChunk` in fallback path; `buildEvidenceIndex` in API response; evidenceId-first highlight in viewer; grounding summary note in UI.
2. **Typed analysis stages** — `AnalysisStage` union threaded through pipeline, logging, and error responses.
3. **Retry + fallback UX** — Client-side page cache; `POST /api/analyze/retry-model`; mode banner; retry on partial AI failure.
4. **Full report export** — `buildReportMarkdown` + download button.
5. **Tests** — Evidence validation, stages, export, API routes, model retry, expanded fixtures.

---

## Infrastructure deliberately avoided

PostgreSQL, Flyway, H2, Testcontainers, Spring Boot, Java, persistent jobs, external queues, user accounts, share links, Q&A, scheduled cleanup, stored document history, wiring unused recovery/async stubs.

---

## PolicyInsight archive recommendation

After CI and smoke pass on this branch, PolicyInsight can be **archived read-only**. Portable patterns (evidence grounding, stages, retry/fallback UX, export, test discipline) are absorbed into BeforeYouSign. Keep the repo for 1–2 release cycles for regression comparison only.
