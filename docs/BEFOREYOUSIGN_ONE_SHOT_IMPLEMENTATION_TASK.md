# BeforeYouSign One-Shot Implementation Task

## Objective

Complete the remaining hardening work in one implementation run while preserving the trust-first lease-analysis product contract. The implementation must leave the repository in a deployable state, use small independently verifiable commits, and integrate each commit into `main` immediately after its checks pass.

## Product decisions for this run

- Use one-request synchronous analysis with no report recovery.
- Do not add accounts, a database, background jobs, queues, OCR, or long-lived persistence.
- Preserve PDF and pasted-text limits, deterministic findings, evidence grounding, model fallback behavior, privacy-safe events, legal-reference verification, and the informational-not-legal-advice disclaimer.
- Treat the existing dirty paths (`evaluation/baselines/deterministic-v1.json`, `qa-screenshots/`, `redesign/`, and `scripts/p0a-browser-qa.mjs`) as unrelated user work; do not stage or modify them.

## Work units and commit boundaries

1. `docs: replace daily roadmap with one-shot hardening task`
   - Add this task document.
   - Reconcile the durable progress ledger with the one-shot decision and remaining work.
   - Verify documentation references the actual synchronous, no-recovery lifecycle.

2. `architecture: remove dormant process-local recovery and async job paths`
   - Remove unreferenced process-local report recovery and async job routes/stores.
   - Remove rollout flags that imply unsupported recovery or background processing.
   - Keep `POST /api/analyze` and the client-side in-session result flow as the only report lifecycle.
   - Add focused regression coverage for the supported lifecycle and absence of recovery behavior.

3. `security: add tested baseline headers and CSP`
   - Add baseline security headers and a production-safe CSP through Next.js configuration.
   - Allow only resources required by this app, including same-origin assets and PDF blob previews.
   - Add unit coverage for the policy and ensure server-side model calls do not require browser-wide origins.

4. `accessibility: harden intake and report controls`
   - Remove nested interactive controls from PDF intake.
   - Add complete tab/tabpanel relationships, form labels, live error/status messaging, and dialog semantics.
   - Preserve keyboard and pointer behavior.
   - Extend the browser smoke test to cover keyboard-visible intake controls.

5. `ci: verify production-build browser flow`
   - Run Playwright against the production build in CI, installing the required browser.
   - Keep deterministic evaluation, legal-reference, typecheck, lint, unit, coverage, and build gates intact.
   - Record the final verification and remaining limitations in the progress ledger and README.

## Required verification

Run the narrowest relevant checks after each work unit, then run the complete local gate before final publication:

```text
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run evaluate
npm run verify:legal
npm run build
npm run test:e2e
```

Every commit must be made only after its own focused checks pass, pushed, and fast-forward merged into `main`. No force-pushes, unrelated staging, bypassed checks, or deployment claims without evidence.

## Completion criteria

- The roadmap is represented by this one-shot task and no longer blocks on a report-lifecycle question.
- The supported report lifecycle is synchronous and explicitly non-persistent.
- Security headers, accessibility behavior, and production-build E2E coverage are implemented and tested.
- Documentation and public claims match the code.
- Unrelated user changes remain untouched.
- `main` contains the verified commits and the publication record identifies each commit and push/merge result.
