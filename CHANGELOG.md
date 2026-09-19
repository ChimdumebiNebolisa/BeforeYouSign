# Changelog

## Unreleased

- Restore reproducible Node 24 installs and Vercel builds with a synchronized lockfile and `npm ci`.
- Align PDF uploads with the Vercel request limit by enforcing a 4 MiB file ceiling and a 4.25 MiB multipart ceiling.
- Make deterministic risk signals clause-local, calculate severity per finding, and diversify displayed review items.
- Replace count-only evaluation with annotated value, category, topic, span, grounding, and risk-band gates.
- Remove the unused AI dependency, model smoke path, retry endpoint, no-op OCR adapter, and generated QA screenshots.
- Rename legal verification to legal-reference metadata verification and add a quarterly human source-review checklist.
- Keep lease analysis deterministic and remove the retired AI/model-retry surface from the supported product path.
- Add bounded request parsing, early PDF page/character limits, malformed-input responses, and proxy-header trust controls.
- Improve modal keyboard accessibility and expand route-level regression coverage.
- Reconcile QA checks and documentation with the current deterministic lease-review workflow.
- Add `@vitest/coverage-v8` and `npm run test:coverage` with 95% thresholds on critical extraction modules.
- Added repeatable QA smoke script commands and Playwright dev dependency support. Contributed by @andrewkernel in #1.
