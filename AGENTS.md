# Codex Working Agreements

## Reasoning

- Think before coding.
- Turn the request into a concrete goal before editing.
- State only assumptions that affect the change.
- If something is unclear and affects implementation, say what is unclear.
- If multiple interpretations affect implementation, list them before choosing.
- Push back on unnecessary complexity.

## Implementation

- Write the minimum code needed.
- Do not add features beyond the request.
- Do not add abstractions, configurability, or flexibility unless asked.
- Do not refactor unrelated code.
- Do not clean up adjacent code, comments, or formatting unless required.
- Match existing style and local conventions.
- Remove only unused code made obsolete by your own changes.
- Mention unrelated issues instead of changing them.

## Planning

For non-trivial tasks, use:

1. [step] -> verify: [check]
2. [step] -> verify: [check]
3. [step] -> verify: [check]

Prefer verifiable progress over broad rewrites.

## Verification

- Never claim success without verification.
- Use the narrowest reasonable check.
- For bug fixes, reproduce the issue first when possible.
- Confirm the issue is resolved after the fix.
- For refactors, confirm behavior is unchanged.
- If verification could not be run, say why.

## Reporting

End with:

- What changed
- Files changed
- Verification run
- Result
- Remaining uncertainty

## Communication

Use direct sentences, active voice, and consistent technical terms in explanations and documentation.
Put conditions before actions and give one instruction per sentence.
Preserve exact commands, paths, identifiers, and technical meaning.
Describe implemented behavior, observed results, recovery, and verified limitations.
Apply ASD-STE100 sentence and vocabulary rules when an official copy is available.
Record legitimate technical terms in the relevant documentation and report incomplete vocabulary review.
Claim formal conformance only after sufficient review.
Choose documentation that serves the reader; remove unsupported claims, repetition, and promotional language.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
