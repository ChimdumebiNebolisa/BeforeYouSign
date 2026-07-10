import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

export function buildLeaseAnalysisUserPrompt(input: {
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  texasRenterFindings?: TexasRenterFinding[];
  evidenceCatalog?: { id: string; page: number; text: string }[];
  maxLeaseChars?: number;
}): string {
  const maxChars = input.maxLeaseChars ?? input.leaseText.length;
  if (input.leaseText.length > maxChars) {
    throw new Error(`Lease text exceeds the ${maxChars} character analysis limit.`);
  }

  const leaseText = input.leaseText;
  const findingsJson = JSON.stringify(input.ruleBasedFindings, null, 2);
  const texasFindingsJson = JSON.stringify(input.texasRenterFindings ?? [], null, 2);
  const evidenceJson = JSON.stringify(input.evidenceCatalog ?? [], null, 2);

  return `You help renters understand residential lease text for educational purposes only. You are not a lawyer and must not give legal advice. Your output helps renters review wording and prepare questions — it does not decide whether they should sign or whether a term is lawful. Local landlord-tenant law is not reviewed.

Output format (critical):
- Return one JSON object only. No other text.
- Do not wrap JSON in markdown code fences (\`\`\` or \`\`\`json).
- Do not add commentary, explanations, headings, or prose before or after the JSON.

Rules:
- Use plain English. Be calm and practical.
- Be brief: renters skim on a phone. Prefer short lines they can understand at a glance — avoid long paragraphs.
- Write for first-time renters. Avoid legal or technical words when a simpler phrase works.
- summary: at most 2 sentences; keep each sentence simple (about 25 words or fewer).
- whatYoureAgreeingTo: each item is one short line (about 18 words or fewer).
- riskReason: 1–2 short sentences (about 55 words total or fewer).
- potentialRedFlags: title is a short headline (about 10 words or fewer). explanation: one tight sentence. whyItMatters: one short sentence.
- responsibilities, questionsToAsk, nextSteps, missingOrUnclear: one short line per item.
- moneyAndFees and deadlinesAndNotice: value should state the key fact in few words.
- Base every factual claim on the lease text, RULE_SNIPPETS, or EVIDENCE_CATALOG below.
- The deterministic band below is a rough heuristic from regex rules.
- riskLevel means review priority, not a legal judgment.
- Never use these words in any generated string value: illegal, valid, enforceable, unenforceable, unsafe, critical, red flag, risky, should sign, should not sign.
- TEXAS_RENTER_FINDINGS are curated reference notes created by the app. Do not add new Texas law claims.
- For moneyAndFees, deadlinesAndNotice, and potentialRedFlags, cite evidence ONLY using evidenceIds from EVIDENCE_CATALOG. Do not invent IDs. Do not supply page, quote, or offsets — the server hydrates evidence from IDs.
- potentialRedFlags must include at least one evidenceId when making a factual claim.
- If uncertain, list items in missingOrUnclear instead of guessing.
- disclaimer: use educational, not-legal-advice wording consistent with: "Educational information only. Not legal advice."

LEASE_TEXT:
${leaseText}

EVIDENCE_CATALOG (cite only these IDs for material claims):
${evidenceJson}

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
- moneyAndFees: { label: string, value: string, evidenceIds?: string[] }[]
- deadlinesAndNotice: { label: string, value: string, evidenceIds?: string[] }[]
- responsibilities: string[]
- potentialRedFlags: { id: string, category: "fees"|"renewal"|"notice"|"maintenance"|"utilities"|"guests"|"pets"|"subletting"|"termination"|"entry"|"other", title: string, severity: "minor"|"moderate"|"critical", explanation: string, whyItMatters: string, evidenceIds: string[] }[]
- questionsToAsk: string[]
- nextSteps: string[]
- missingOrUnclear: string[]
- disclaimer: string (short; educational only, not legal advice)`;
}
