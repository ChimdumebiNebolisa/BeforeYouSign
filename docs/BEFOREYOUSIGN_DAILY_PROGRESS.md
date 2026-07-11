# BeforeYouSign Daily Product Hardening Progress

Last updated: 2026-07-11 14:30 America/Chicago

## Current phase

Phase 1: baseline and persistent progress record.

This file is the durable ledger for the scheduled daily hardening task. It must be checked against the current repository before selecting future work.

## Ordered checklist

- [x] Phase 1: Baseline and progress record.
- [x] Phase 2: Production-code and CI coverage started. CI currently runs lint, typecheck, unit tests, deterministic evaluation, legal-reference verification, build, and QA script syntax checks.
- [x] Phase 3: Lease evaluation corpus started with one synthetic standard lease fixture.
- [x] Phase 4: Evaluation metrics started with deterministic grounding and unsupported-finding metrics.
- [x] Phase 5: Evaluation regression gates started with deterministic release gates documented in `evaluation/README.md`.
- [x] Phase 6: Runtime model-schema hardening started with JSON parsing, candidate schema validation, banned wording checks, and fallback behavior.
- [x] Phase 7: Evidence grounding started with evidence registry, normalization, grounding tests, and dropped-claim accounting.
- [ ] Phase 8: Finding provenance and conflict handling.
- [x] Phase 9: Model operational boundaries started with concurrency limits, provider retry limit config, and safe model/failure event categories.
- [ ] Phase 10: Report-lifecycle decision.
- [ ] Phase 11A: One-request no-recovery implementation, pending report-lifecycle decision.
- [ ] Phase 11B: Short-lived persistent recovery, pending report-lifecycle decision.
- [x] Phase 12: Report schema versioning started with `analysisVersion: 2` in API success responses.
- [x] Phase 13: Privacy and logging hardening started with safe analysis event sanitization.
- [x] Phase 14: Rate limits and concurrency controls started with per-client in-flight request limiting.
- [ ] Phase 15: CSP and security headers.
- [ ] Phase 16: Cleanup guarantees.
- [x] Phase 17: Frontend E2E coverage started with `tests/e2e/smoke.spec.ts`; not yet confirmed as production-build CI coverage.
- [ ] Phase 18: Accessibility hardening.
- [ ] Phase 19: Frontend performance.
- [x] Phase 20: Privacy-safe observability started with bounded safe analysis event fields.
- [x] Phase 21: Legal-reference verification started with Texas reference metadata tests and `npm run verify:legal`.
- [ ] Phase 22: Documentation reconciliation.

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

None.

## Report-lifecycle decision status

Unresolved and blocked on the required user decision.

Recommendation: choose one-request analysis with no report recovery unless there is a concrete user need for returning to a previous report after refresh or sharing. It is the smallest privacy-preserving model and matches the README's intended no-database MVP.

Current implementation facts:

- Synchronous `POST /api/analyze` returns the analysis response directly.
- `BYS_RECOVERY_ENABLED=1` exposes `GET` and `DELETE /api/reports/[recoveryToken]`.
- Recovery tokens are high entropy, but reports are stored in a process-local `Map` with a 24-hour TTL.
- `BYS_ASYNC_ENABLED=1` exposes process-local async job routes with a 30-minute TTL.
- Process-local recovery and jobs are not reliable across serverless instances, restarts, or horizontal scaling.

Blocking question for a future run: should BeforeYouSign use one-request analysis with no report recovery, or explicit short-lived persistent report recovery?

## Deferred items

- Report-lifecycle implementation is deferred until the product decision is recorded.
- CSP policy is deferred until required scripts, styles, workers, PDF preview resources, fonts, and provider connections are inventoried.
- Live Gemini behavior is not verified locally without provider credentials and should not be required for deterministic CI.
- Production deployment verification is deferred until a verified deploy step is selected.

## Blockers

- Report lifecycle: product decision required.
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
