import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { RuleBasedFinding } from "@/lib/analysis/rules";

const MAX_LEASE_CHARS = 120_000;

export function buildLeaseAnalysisUserPrompt(input: {
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
}): string {
  const leaseText =
    input.leaseText.length > MAX_LEASE_CHARS
      ? `${input.leaseText.slice(0, MAX_LEASE_CHARS)}\n\n[TRUNCATED_FOR_ANALYSIS]`
      : input.leaseText;

  const findingsJson = JSON.stringify(input.ruleBasedFindings, null, 2);

  return `You help renters understand residential lease text. You are not a lawyer and must not give legal advice.

Output format (critical):
- Return one JSON object only. No other text.
- Do not wrap JSON in markdown code fences (\`\`\` or \`\`\`json).
- Do not add commentary, explanations, headings, or prose before or after the JSON.

Rules:
- Use plain English. Be calm and practical.
- Be brief: renters skim on a phone. Prefer short lines they can understand at a glance — avoid long paragraphs.
- summary: at most 2 sentences; keep each sentence simple (about 25 words or fewer).
- whatYoureAgreeingTo: each item is one short line (about 18 words or fewer); split long ideas into extra bullets instead of stuffing one bullet.
- riskReason: 1–2 short sentences only (about 40 words total or fewer).
- potentialRedFlags: title is a short headline (about 10 words or fewer). explanation: one tight sentence. whyItMatters: one short sentence.
- responsibilities, questionsToAsk, nextSteps, missingOrUnclear: one short line per item; do not repeat the same idea in different words.
- moneyAndFees and deadlinesAndNotice: value should state the key fact in few words (amount, date, or window); add a little context only if needed.
- Base every factual claim on the lease text or the RULE_SNIPPETS below. If something is not in the text, say so in missingOrUnclear instead of guessing.
- The deterministic risk band below is a rough heuristic from regex rules — your riskLevel should usually match it unless the lease text clearly contradicts it; explain any mismatch in riskReason.
- potentialRedFlags must cite evidence: each item needs at least one evidence entry with page and quote copied from the lease or RULE_SNIPPETS.
- If uncertain, list items in missingOrUnclear rather than inventing numbers or clauses.

LEASE_TEXT:
${leaseText}

RULE_SNIPPETS (page + quote, from automated scan):
${findingsJson}

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
- disclaimer: string (short; state you are informational, not legal advice)`;
}
