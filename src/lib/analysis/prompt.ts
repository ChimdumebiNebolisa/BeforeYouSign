import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

const MAX_LEASE_CHARS = 120_000;

export function buildLeaseAnalysisUserPrompt(input: {
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  texasRenterFindings?: TexasRenterFinding[];
}): string {
  const leaseText =
    input.leaseText.length > MAX_LEASE_CHARS
      ? `${input.leaseText.slice(0, MAX_LEASE_CHARS)}\n\n[TRUNCATED_FOR_ANALYSIS]`
      : input.leaseText;

  const findingsJson = JSON.stringify(input.ruleBasedFindings, null, 2);
  const texasFindingsJson = JSON.stringify(input.texasRenterFindings ?? [], null, 2);

  return `You help renters understand residential lease text for educational purposes only. You are not a lawyer and must not give legal advice. Your output helps renters review wording and prepare questions — it does not decide whether they should sign or whether a term is lawful. Local landlord-tenant law is not reviewed.

Output format (critical):
- Return one JSON object only. No other text.
- Do not wrap JSON in markdown code fences (\`\`\` or \`\`\`json).
- Do not add commentary, explanations, headings, or prose before or after the JSON.

Rules:
- Use plain English. Be calm and practical.
- Be brief: renters skim on a phone. Prefer short lines they can understand at a glance — avoid long paragraphs.
- Write for first-time renters. Avoid legal or technical words when a simpler phrase works. If you must use a lease term, explain it in simple words. Prefer "moving out early" over "early termination," "the lease keeps going unless you give notice" over "automatic renewal," "fees that are not clearly listed" over "open-ended fees," and "things the lease says you must do" over "lease obligations." Keep each explanation to one short sentence when possible.
- summary: at most 2 sentences; keep each sentence simple (about 25 words or fewer). Pull in distinctive facts from the lease when they appear: term start/end dates, monthly rent, security deposit, automatic renewal, notice to vacate or non-renew, and who pays which utilities. Avoid generic contract boilerplate that could describe any agreement.
- whatYoureAgreeingTo: each item is one short line (about 18 words or fewer); split long ideas into extra bullets instead of stuffing one bullet.
- riskReason: 1–2 short sentences (about 55 words total or fewer). Name the strongest concrete factors drawn from the lease text or RULE_SNIPPETS — cite what the language actually does (e.g. automatic renewal, a specific late-fee rule, early-termination wording). Avoid vague inventory phrases like "several distinct fees" unless you also name the fee types or quote patterns you mean.
- potentialRedFlags: title is a short headline (about 10 words or fewer). explanation: one tight sentence. whyItMatters: one short sentence.
- For explanations and whyItMatters, use direct renter language. Avoid heavy terms like "liability," "re-rented," "ordinary wear," "landlord's discretion," "recurring fees," "assignment," or "clause" unless the simpler meaning would be unclear.
- responsibilities, questionsToAsk, nextSteps, missingOrUnclear: one short line per item; do not repeat the same idea in different words.
- moneyAndFees and deadlinesAndNotice: value should state the key fact in few words (amount, date, or window); add a little context only if needed.
- moneyAndFees and deadlinesAndNotice should include evidence when the lease text or RULE_SNIPPETS supports it; use the closest short quote that proves the amount, date, window, or obligation.
- Base every factual claim on the lease text or the RULE_SNIPPETS below. If something is not in the text, say so in missingOrUnclear instead of guessing.
- The deterministic band below is a rough heuristic from regex rules — your riskLevel should usually match it unless the lease text clearly contradicts it; explain any mismatch in riskReason.
- riskLevel means review priority, not a legal judgment. It estimates how much attention the lease may need before signing based on renter-facing issues found in the text. Use "high" to mean more items worth a closer look, not "do not sign." If the deterministic scan is low or weak-medium but you still see notable terms in the text, explain that tension briefly in riskReason rather than defaulting to "high" without specifics.
- In all user-facing string values (summary, titles, explanations, riskReason, nextSteps, etc.), use "review priority" and "terms to review" language. JSON field names stay riskLevel, riskReason, and potentialRedFlags — only the string content should use safer wording.
- severity values in JSON stay minor, moderate, or critical — treat them as attention levels only; never use the word "critical" in titles or explanations.
- Never use these words in any generated string value: illegal, valid, enforceable, unenforceable, unsafe, critical, red flag, risky, should sign, should not sign.
- Do not say or imply that a lease or clause is unlawful, unenforceable, or that the renter should or should not sign. Instead, explain what the clause may affect and what the renter may want to review or ask about.
- TEXAS_RENTER_FINDINGS are curated reference notes created by the app. Do not add new Texas law claims. Do not decide if a lease term is legal. Do not say illegal, valid, enforceable, unenforceable, safe, or unsafe. You may mention these findings only as educational items to review.
- potentialRedFlags must cite evidence: each item needs at least one evidence entry with page and quote copied from the lease or RULE_SNIPPETS.
- If uncertain, list items in missingOrUnclear rather than inventing numbers or clauses.
- disclaimer: use educational, not-legal-advice wording consistent with: "Educational information only. Not legal advice."

LEASE_TEXT:
${leaseText}

RULE_SNIPPETS (page + quote, from automated scan):
${findingsJson}

TEXAS_RENTER_FINDINGS (curated reference notes from the app — do not invent additional Texas law claims):
${texasFindingsJson}

DETERMINISTIC_SCAN:
score: ${input.deterministicRisk.score}
band: ${input.deterministicRisk.band}
reasons:
${input.deterministicRisk.reasons.map((r) => `- ${r}`).join("\n")}

Return JSON with exactly these keys and value types:
- summary: string
- whatYoureAgreeingTo: string[]
- riskLevel: "low" | "medium" | "high"
- riskReason: string
- moneyAndFees: { label: string, value: string, evidence?: { page: number, quote: string }[] }[]
- deadlinesAndNotice: { label: string, value: string, evidence?: { page: number, quote: string }[] }[]
- responsibilities: string[]
- potentialRedFlags: { id: string, category: "fees"|"renewal"|"notice"|"maintenance"|"utilities"|"guests"|"pets"|"subletting"|"termination"|"entry"|"other", title: string, severity: "minor"|"moderate"|"critical", explanation: string, whyItMatters: string, evidence: { page: number, quote: string }[] }[]
- questionsToAsk: string[]
- nextSteps: string[]
- missingOrUnclear: string[]
- disclaimer: string (short; educational only, not legal advice)`;
}
