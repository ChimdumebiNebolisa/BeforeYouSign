# BeforeYouSign Evaluation Harness

Deterministic evaluation runs offline in CI. The supported product path does not call an external model.

## Fixture classes

- `evaluation/fixtures/synthetic/` — synthetic and adversarial leases only (safe for git)
- `evaluation/fixtures/public/` — public-domain or permissively licensed samples

## Annotation contract

See `evaluation/schema/annotation.schema.json`. Every fixture declares expected rule categories and Texas topics, including explicit empty arrays. Material clauses carry page-local annotation spans. Factual extraction labels remain separate from legal interpretation.

## Commands

- `npm run evaluate` — deterministic rules-only evaluation; compares against the committed baseline without writing it
- Update the baseline only through an explicit reviewed change to `evaluation/baselines/deterministic-v1.json`
- `npm test` — unit/property tests including grounding and evidence registry

## Release gates

- 100% grounding rate for emitted material claims in deterministic mode
- 0 unsupported emitted findings
- 100% expected-value accuracy for annotated rent and deposit amounts
- 100% rule-category and Texas-topic precision and recall
- 100% annotated-span recall at 0.5 or greater same-page/category overlap
- 100% expected risk-band accuracy when a fixture declares a band
