# BeforeYouSign Evaluation Harness

Deterministic evaluation runs offline in CI. Model evaluation is budgeted separately.

## Fixture classes

- `evaluation/fixtures/synthetic/` — synthetic leases only (safe for git)
- `evaluation/fixtures/public/` — public-domain or permissively licensed samples
- `evaluation/fixtures/adversarial/` — prompt-injection and grounding attack cases

## Annotation contract

See `evaluation/schema/annotation.schema.json`. Factual extraction labels are separate from legal interpretation.

## Commands

- `npm run evaluate` — deterministic rules-only evaluation, writes `evaluation/baselines/deterministic-v1.json`
- `npm test` — unit/property tests including grounding and evidence registry

## Release gates

- 100% grounding rate for emitted material claims in deterministic mode
- 0 unsupported emitted findings
- Regression bounds documented in `evaluation/reviews/`
