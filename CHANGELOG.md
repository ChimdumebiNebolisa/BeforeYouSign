# Changelog

## Unreleased

- Add PolicyInsight pattern extraction: typed analysis stages, evidence ID-first highlighting, hardened model-only retry endpoint, analysis mode banner, and full report Markdown export.
- Harden retry payload validation (size limits, page schema, server-side evidence rebuild) and drop ungrounded claims instead of fabricating evidence.
- Track [docs/POLICYINSIGHT_EXTRACTION_AUDIT.md](docs/POLICYINSIGHT_EXTRACTION_AUDIT.md) in git; dedupe analysis mode labels and report copy.
- Add `@vitest/coverage-v8` and `npm run test:coverage` with 95% thresholds on critical extraction modules.
- Added repeatable QA smoke script commands, Playwright dev dependency support, and a GitHub Actions syntax-check workflow for QA scripts. Contributed by @andrewkernel in #1.
