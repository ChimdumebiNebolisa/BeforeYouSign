# Legal Source Review

The automated `npm run verify:legal-metadata` command checks reference structure, dates, HTTPS URL syntax, and the public disclaimer. It does not determine whether a source is legally current or whether the application summary is legally correct.

## Quarterly owner checklist

For every record in `src/lib/legal-reference/texas-renter-references.ts`:

- Open the authoritative `sourceUrl` in a browser.
- Confirm the source title and cited section still exist.
- Confirm the section remains relevant to the associated renter topic.
- Compare the source with `plainEnglishSummary` without expanding the application into legal advice.
- Update `reviewedAt` to the review date; update `effectiveThrough` only when the source states one.
- Record the reviewer and date in the review log below.
- Run `npm run verify:legal-metadata` and the full test suite.

Repeat this review before a public release whenever the application displays a source-freshness warning.

## Review log

| Review date | Reviewer | Result | Notes |
|---|---|---|---|
| _YYYY-MM-DD_ | _Name_ | _Pass / changes required_ | _Source or summary changes_ |
