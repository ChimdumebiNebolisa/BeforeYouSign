# BeforeYouSign Daily Product Hardening Progress

Last updated: 2026-07-12 16:40 America/Chicago

## Current phase

One-shot hardening run: report lifecycle selected; security, accessibility, CI, and documentation work in progress.

The daily single-work-unit policy has been superseded for this run by
`docs/BEFOREYOUSIGN_ONE_SHOT_IMPLEMENTATION_TASK.md`, which preserves small
verified commits and immediate push/merge boundaries.

This file is the durable ledger for the scheduled daily hardening task. It must be checked against the current repository before selecting future work.

## Ordered checklist

- [x] Phase 1: Baseline and progress record.
- [x] Phase 2: Production-code and CI coverage started. CI currently runs lint, typecheck, unit tests, deterministic evaluation, legal-reference verification, build, and QA script syntax checks.
- [x] Phase 3: Lease evaluation corpus started with one synthetic standard lease fixture.
- [x] Phase 4: Evaluation metrics started with deterministic grounding and unsupported-finding metrics.
- [x] Phase 5: Evaluation regression gates started with deterministic release gates documented in `evaluation/README.md`.
- [x] Phase 6: Runtime model-schema hardening started with JSON parsing, candidate schema validation, banned wording checks, and fallback behavior.
- [x] Phase 7: Evidence grounding started with evidence registry, normalization, grounding tests, and dropped-claim accounting.
- [x] Phase 8: Finding provenance and conflict handling started with red-flag producer provenance for deterministic fallback and model-grounded findings.
- [x] Phase 9: Model operational boundaries started with concurrency limits, provider retry limit config, and safe model/failure event categories.
- [x] Phase 10: Report-lifecycle decision: one-request synchronous analysis with no report recovery selected.
- [x] Phase 11A: One-request no-recovery implementation; dormant process-local recovery and async paths removed.
- [x] Phase 11B: Short-lived persistent recovery not selected; no database or persistent report store is in scope.
- [x] Phase 12: Report schema versioning started with `analysisVersion: 2` in API success responses.
- [x] Phase 13: Privacy and logging hardening started with safe analysis event sanitization.
- [x] Phase 14: Rate limits and concurrency controls started with per-client in-flight request limiting.
- [x] Phase 15: CSP and security headers with unit-tested Next.js header policy.
- [x] Phase 16: Cleanup guarantees; no temporary files or server-side report/job stores are used by the supported lifecycle.
- [x] Phase 17: Frontend E2E coverage runs against the production build in CI.
- [x] Phase 18: Accessibility hardening for intake tabs, PDF intake, text controls, dialogs, and live statuses.
- [ ] Phase 19: Frontend performance.
- [x] Phase 20: Privacy-safe observability started with bounded safe analysis event fields.
- [x] Phase 21: Legal-reference verification started with Texas reference metadata tests and `npm run verify:legal`.
- [x] Phase 22: Documentation reconciled with the synchronous no-recovery lifecycle and CI gates.

## Completed work units

### 2026-07-11: Baseline and progress record

Confirmed that `docs/BEFOREYOUSIGN_DAILY_PROGRESS.md` was missing and created it from the current repository state.

Existing state verified:

- No repository-local `AGENTS.md` was found by `rg --files -g AGENTS.md -g '!node_modules' -g '!.next'`; the automation prompt's AGENTS instructions were followed as the active instructions.
- Current branch is `main`; remote is `origin https://github.com/ChimdumebiNebolisa/BeforeYouSign.git`.
- Initial `git status --short` showed unrelated untracked paths: `qa-screenshots/`, `redesign/`, and `scripts/p0a-browser-qa.mjs`.
- `README.md`, docs, package manifests, workflows, API routes, pipeline, persistence, evaluation, observability, and rollout flag files were inspected before selecting work.
- `src/lib/persistence/report-store.ts` and `src/lib/jobs/store.ts` use process-local `Map` stores behind rollout flags, so report lifecycle remains unresolved and should not be treated as production-reliable recovery.

Blast radius:

- Documentation only: persistent progress tracking.
- No product runtime behavior changed.

## Current in-progress work unit

One-shot hardening run is complete; final publication record is appended below after the last commit is merged.

## Report-lifecycle decision status

Resolved: one-request analysis with no report recovery.

Current implementation facts:

- Synchronous `POST /api/analyze` returns the analysis response directly.
- The only supported report path is synchronous `POST /api/analyze`, which returns the analysis response directly.
- Process-local recovery and async job routes, stores, and flags were removed because they were not reliable across serverless instances, restarts, or horizontal scaling.
- Results remain in browser state and are intentionally lost on refresh.

## Deferred items

- Live Gemini behavior is not verified locally without provider credentials and should not be required for deterministic CI.
- Production deployment verification is deferred until a verified deploy step is selected.

## Blockers

- External model behavior: no live provider call was run in this baseline audit.
- Production behavior: no Vercel deployment or production logs were inspected in this baseline audit.

## Commands executed

- `git status --short` -> exit 0; showed `?? qa-screenshots/`, `?? redesign/`, `?? scripts/p0a-browser-qa.mjs`.
- `rg --files -g AGENTS.md -g '!node_modules' -g '!.next'` -> exit 1; no repository-local `AGENTS.md` found.
- `git branch --show-current` -> exit 0; `main`.
- `git remote -v` -> exit 0; `origin` fetch/push configured for `ChimdumebiNebolisa/BeforeYouSign`.
- `npm run typecheck` -> exit 0.
- `npm test` -> exit 0; 14 test files passed, 66 tests passed.
- `npm run evaluate` -> exit 0; 1 integration test passed. Generated deterministic results showed 1 fixture, average grounding rate 1, unsupported finding rate 0 for the synthetic standard fixture. The generated timestamp-only baseline change was not retained.
- `npm run verify:legal` -> exit 0; 10 unique IDs checked, landlord-entry citation correction checked, metadata checks passed.

## Verification results

Typecheck passed.

Unit and integration tests passed: 14 files, 66 tests.

Deterministic evaluation passed: 1 fixture, average grounding rate 1, unsupported finding rate 0.

Legal-reference verification passed: 10 unique IDs and metadata checks.

Build was not run in this baseline work unit because no production code changed; future product or UI changes should run `npm run build`.

Playwright was not run in this baseline work unit; future frontend work should run targeted E2E checks.

## Production coverage measurements

Current coverage is test-count based only; no line or branch coverage command is configured in `package.json`.

Relevant current coverage surfaces:

- Unit tests: model JSON parsing, legal references, report normalization, Texas scan, rules, safe events, scoring, evidence, grounding, schema, limits, normalization.
- Integration tests: pipeline and deterministic evaluation.
- E2E tests: `tests/e2e/smoke.spec.ts`, not run in this baseline audit.

## Evaluation metrics

Current deterministic baseline:

- Fixture count: 1.
- Average grounding rate: 1.
- Synthetic standard fixture mode: `rules_only`.
- Unsupported finding rate: 0.
- Rule findings: 6.
- Texas topics: 3.

Metrics are early and do not yet cover precision, recall, category accuracy, page-link accuracy, fee extraction accuracy, deadline extraction accuracy, fabricated evidence rate, or live model-assisted performance.

## Evidence-grounding findings

Current implementation includes an evidence registry and model candidate grounding.

Observed behavior from code:

- Model material claims without hydratable evidence IDs are dropped from money, deadline, and red-flag report sections.
- If no model material claims survive grounding, the system falls back to the rule-only report.
- Banned wording in model summary, risk reason, flag title, or flag explanation causes fallback or claim dropping.
- Grounding summary records material, grounded, and dropped claims.

Remaining gaps:

- Finding provenance and deterministic/model conflict handling are not fully recorded in rendered findings.
- Exact page-link validation, repeated-clause ambiguity, and wrong-page rejection need further roadmap work.

## Model-provider behavior not verified locally

No live Gemini request was made during this baseline audit.

Provider timeout, rate limit, refusal, invalid structured output, truncated output, and empty response behavior should remain covered by local tests or future provider-specific verification before being claimed.

## Privacy and retention decisions

Current verified behavior:

- Safe analysis events use bounded fields and redact sensitive-looking string values.
- Development-only event logging avoids lease contents by design, but future logging changes must preserve this.
- Recovery, if enabled, retains full analysis responses in process memory for 24 hours.
- Async jobs, if enabled, retain job state in process memory for 30 minutes.

No final report retention decision is recorded.

## Security decisions

Current verified behavior:

- PDF uploads enforce byte, signature, page, and extracted-character limits through intake and extraction code.
- Pasted text enforces the configured character limit.
- Per-client concurrent analysis requests are limited to 1.
- Recovery tokens use 32 random bytes encoded as base64url when the recovery flag is enabled.

Remaining gaps:

- No tested CSP is recorded.
- Baseline security headers have not been audited in this progress file.
- Process-local recovery is not suitable as reliable production report recovery.

## Performance measurements

No bundle-size, route bundle, PDF-preview, report-rendering, or large-report measurements were taken during this baseline audit.

## Architectural decisions

- The source of truth is the current `main` worktree.
- Existing no-database direction remains preferred until the report-lifecycle decision changes it.
- Process-local storage is documented as a current limitation, not a reliable production architecture.
- Future work should preserve direct synchronous analysis unless a recorded product decision requires persistent recovery.

## Files and systems affected

Affected in this run:

- `docs/BEFOREYOUSIGN_DAILY_PROGRESS.md`

### 2026-07-12: Red-flag finding provenance

Selected work unit: Phase 8 vertical slice for red-flag provenance from producer to consumer.

Existing state verified:

- `git status --short` at start showed unrelated dirty/untracked files: `evaluation/baselines/deterministic-v1.json`, `qa-screenshots/`, `redesign/`, and `scripts/p0a-browser-qa.mjs`.
- Repository-local `AGENTS.md` was still absent; the automation prompt's AGENTS instructions were followed.
- `src/lib/analysis/schema.ts` had finding category, severity, evidence, and support status, but no finding provenance.
- `src/lib/analysis/fallback-report.ts` assembled deterministic rule-only red flags without producer origin.
- `src/lib/analysis/ground-model-candidates.ts` assembled grounded model red flags without producer origin.
- `src/components/beforeyousign/lease-report-slides.tsx`, `src/lib/report-export.ts`, and `src/lib/checklist-export.ts` rendered/exported red flags without provenance.

Implemented behavior:

- Added `FindingProvenance = "deterministic" | "model" | "combined"` to the report schema, with runtime validation when present.
- Marked rule-only fallback red flags as `deterministic`.
- Marked grounded model red flags as `model`.
- Added user-facing provenance labels: `Pattern scan`, `AI grounded`, `Pattern + AI`, and a legacy fallback `Origin unknown`.
- Displayed provenance badges in the report's terms-to-review UI.
- Included provenance in full report Markdown export and question-checklist Markdown export.
- Added regression tests for schema validation, fallback producer provenance, model producer provenance, and both export paths.

Self-review findings:

- First pass missed the checklist export consumer; it was updated to include the same red-flag origin line as full report export.
- The schema keeps provenance optional for legacy report JSON compatibility, but all newly assembled fallback/model red flags now include provenance.
- No process-local persistence, recovery, deletion, legal references, intake limits, model prompt shape, or evidence matching semantics were changed.

Blast radius:

- Affected: runtime report schema, deterministic fallback report assembly, grounded model report assembly, red-flag UI rendering, Markdown exports, focused unit tests.
- Not affected: PDF intake, text intake, extraction limits, normalization, deterministic rule matching, scoring, Gemini request prompt/schema, evidence registry, report persistence, recovery endpoints, deletion behavior, CI workflows, legal-reference data, security headers.

Verification:

- Baseline focused command before edits: `npm test -- tests/unit/grounding.test.ts tests/unit/report-export.test.ts tests/unit/schema.test.ts` -> exit 0; 3 files passed, 16 tests passed.
- Focused post-change command: `npm test -- tests/unit/grounding.test.ts tests/unit/report-export.test.ts tests/unit/schema.test.ts tests/unit/evidence-validation.test.ts` -> exit 0; 4 files passed, 24 tests passed.
- Broad command: `npm test` -> exit 0; 21 files passed, 138 tests passed.
- Broad command: `npm run typecheck` -> exit 0.
- Broad command: `npm run lint` -> exit 0 with 2 pre-existing warnings outside this work unit: `coverage/block-navigation.js` unused eslint-disable and `src/app/api/analyze/route.ts` unused `parseAnalysisErrorMessage`.
- Final focused command after cleanup: `npm test -- tests/unit/schema.test.ts tests/unit/grounding.test.ts tests/unit/report-export.test.ts tests/unit/evidence-validation.test.ts` -> exit 0; 4 files passed, 24 tests passed.
- Final command: `npm run typecheck` -> exit 0.
- Final command: `npm run lint` -> exit 0 with the same 2 pre-existing warnings outside this work unit.
- Production build: `npm run build` -> exit 0; Next.js 16.2.0 compiled successfully and generated 8 static pages.

Public claims verified:

- Introduced UI/export labels `Pattern scan`, `AI grounded`, and `Pattern + AI`.
- Verified by producer tests that deterministic fallback red flags use `deterministic` and grounded model red flags use `model`; export tests verify the displayed labels.
- No legal, privacy, retention, security-header, accessibility, or model-quality claims were introduced or changed.

GitHub and deployment status:

- Branch: `main`.
- Code commit: `3b07c0c` (`Add report finding provenance`) pushed to `origin/main`.
- PR: not used; direct `main` push was allowed by the automation override.
- Vercel project: `before-you-sign` (`prj_DzQUvXeIbeQeDK1HCg3g7D1rAsol`) in team `team_Hbamk0DrxWvUVBm3MGmRW9T0`.
- Deployment from code commit: `dpl_ChnLdEVuQ3fdFr9pSVavE9E823Jm`, target `production`, state `READY`, URL `https://before-you-sign-8ylwfrbf4-chimdumebinebolisagmailcoms-projects.vercel.app`.
- Production aliases reported by Vercel: `https://before-you-sign-one.vercel.app`, `https://before-you-sign-chimdumebinebolisagmailcoms-projects.vercel.app`, and `https://before-you-sign-git-main-chimdumebinebolisagmailcoms-projects.vercel.app`.

Inspected in this run:

- `README.md`
- `docs/GUARDRAILS.md`
- `docs/SPEC.md`
- `docs/IMPLEMENTATION_CHECKLIST.md`
- `docs/MILESTONES.md`
- `package.json`
- `.github/workflows/ci.yml`
- `.github/workflows/qa-script-syntax.yml`
- `src/app/api/analyze/route.ts`
- `src/app/api/analyses/route.ts`
- `src/app/api/analyses/[jobId]/route.ts`
- `src/app/api/reports/[recoveryToken]/route.ts`
- `src/lib/analysis/pipeline/run-analysis.ts`
- `src/lib/analysis/pipeline/validate-intake.ts`
- `src/lib/analysis/pipeline/assemble-response.ts`
- `src/lib/analysis/ground-model-candidates.ts`
- `src/lib/analysis/limits.ts`
- `src/lib/evaluation/metrics.ts`
- `src/lib/observability/safe-analysis-events.ts`
- `src/lib/persistence/report-store.ts`
- `src/lib/jobs/store.ts`
- `src/lib/rollout/flags.ts`
- `evaluation/README.md`
- `evaluation/baselines/deterministic-v1.json`

## Public claims verified

No public-facing product, privacy, retention, legal, model, evidence, accessibility, or security claims were introduced or changed in this run.

Existing legal-reference verification passed via `npm run verify:legal`.

## Legal-reference verification status

`npm run verify:legal` passed in this run.

Legal-reference scope remains Texas renter references as implemented in `src/lib/legal-reference`.

## GitHub and deployment status

- Branch: `main`.
- Commit: pending at the time this progress record was created.
- Push: pending.
- PR: not used; direct commit to `main` is allowed by the current automation override if verification passes and unrelated changes are preserved.
- Deployment: not performed in this baseline documentation run.

## 2026-07-12: One-shot hardening completion record

Selected task: execute the remaining roadmap hardening in one run with small commits, detailed messages, and immediate push/fast-forward merge into `main`.

Implementation completed:

- `34a95e4` `docs: replace daily roadmap with one-shot hardening task` — added the one-shot task and recorded the no-recovery decision.
- `4e64f16` `architecture: remove dormant process-local recovery and async job paths` — removed process-local recovery/async routes, stores, workers, and flags; kept synchronous analysis as the supported lifecycle.
- `0c52703` `security: add tested baseline headers and CSP` — added the tested same-origin CSP and baseline browser security headers.
- `62b9a50` `accessibility: harden intake and report controls` — fixed nested PDF intake controls, added tab/dialog/form/status semantics, added keyboard E2E coverage, and declared `@playwright/test`.
- Final CI/documentation commit: pending until this record is committed.

Verification results for the final local gate:

- `npm test` -> exit 0; 22 files passed, 141 tests passed.
- `npm run test:coverage` -> exit 0; 22 files passed, 141 tests passed; 98.09% statements, 96.61% branches, 100% functions, 98.09% lines.
- `npm run typecheck` -> exit 0.
- `npm run lint` -> exit 0 with two pre-existing warnings: generated `coverage/block-navigation.js` unused eslint-disable and unused `parseAnalysisErrorMessage` in `src/app/api/analyze/route.ts`.
- `npm run evaluate` -> exit 0; 1 fixture, average grounding rate 1, unsupported finding rate 0.
- `npm run verify:legal` -> exit 0; 10 unique IDs and metadata checks passed.
- `npm run build` -> exit 0; production build generated only the supported routes `/`, `/api/analyze`, and `/api/analyze/retry-model` plus static icons.
- `npm run test:e2e` against an explicitly owned production server on port 3100 -> exit 0; 2 tests passed.
- The local E2E command initially exposed the missing `@playwright/test` dependency and a stale port-3000 listener; the dependency was added, the stale listener was not modified, and the final check used an owned port-3100 server.

Publication state for this run:

- Working branch: `agent/one-shot-hardening`, pushed to `origin/agent/one-shot-hardening`.
- Commits `34a95e4`, `4e64f16`, `0c52703`, and `62b9a50` were each pushed and fast-forward merged into `origin/main`.
- The CI/documentation commit containing this record remains to be created and published.
- No deployment was performed; production deployment verification remains an explicit deferred item.
