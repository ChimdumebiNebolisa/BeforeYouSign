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

Rules:
- Respond with a single JSON object only. No markdown, no code fences, no commentary outside JSON.
- Use plain English. Be calm and practical.
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
