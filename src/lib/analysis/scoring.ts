import type { RuleBasedFinding } from "@/lib/analysis/rules";

export type DeterministicRiskBand = "low" | "medium" | "high";

export type DeterministicLeaseRisk = {
  score: number;
  band: DeterministicRiskBand;
  reasons: string[];
};

/**
 * Semi-deterministic score (SPEC 2.7): sums weighted signals from extracted text and rule snippets.
 * Bands: low 0–1, medium 2–4, high 5+.
 */
export function computeDeterministicLeaseRisk(input: {
  fullText: string;
  findings: RuleBasedFinding[];
  unclearPhrases: { page: number; quote: string }[];
}): DeterministicLeaseRisk {
  const text = input.fullText;
  let score = 0;
  const reasons: string[] = [];

  const renewalAuto = input.findings.some(
    (f) =>
      f.category === "renewal" &&
      /\b(?:automatic(?:ally)?|auto[\s-]?renew(?:al)?)\b/i.test(f.quote),
  );
  if (renewalAuto) {
    score += 2;
    reasons.push("This lease may renew automatically unless notice is given.");
  }

  const aggressiveLate = input.findings.some((finding) => {
    if (finding.category !== "fees" || !/\blate\b/i.test(finding.quote)) return false;
    return Array.from(finding.quote.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)).some(
      (match) => Number(match[1]) >= 10,
    );
  });
  const dailyLate = input.findings.some(
    (finding) =>
      finding.category === "fees" &&
      /\blate\b/i.test(finding.quote) &&
      /\b(?:per|each)\s+day\b|\bdaily\b/i.test(finding.quote),
  );
  if (aggressiveLate || dailyLate) {
    score += 2;
    reasons.push("Late-fee terms may add costs quickly if rent is late.");
  }

  if (input.unclearPhrases.length > 0) {
    score += 2;
    reasons.push("Some fee or policy terms appear open-ended.");
  }

  const feeCount = input.findings.filter((f) => f.category === "fees").length;
  if (feeCount >= 3) {
    score += 2;
    reasons.push(`We found ${feeCount} fee clauses that may increase total cost.`);
  }

  const earlyTerminatePenalty = input.findings.some(
    (finding) =>
      finding.category === "fees" &&
      /\bearly\s+terminat/i.test(finding.quote) &&
      /\b(?:penalty|fee|forfeit|liquidated\s+damages|remainder\s+of\s+(?:the\s+)?rent)\b/i.test(
        finding.quote,
      ),
  );
  if (earlyTerminatePenalty) {
    score += 2;
    reasons.push("Ending the lease early may trigger extra charges.");
  }

  const utilitiesSnips = input.findings.filter((f) => f.category === "utilities");
  const utilitiesVague = utilitiesSnips.some(
    (finding) =>
      /\butilities\b/i.test(finding.quote) &&
      !(
        /\b(?:tenant|landlord)\b[^.]{0,200}\b(?:responsible(?:\s+for)?|pays?|shall\s+pay|must\s+pay|reimburs(?:e|es|ement))\b/i.test(
          finding.quote,
        ) ||
        /\b(?:utilities?|electric|gas|water|sewer|trash)\b[^.]{0,200}\b(?:paid\s+by|responsibility\s+of)\s+(?:the\s+)?(?:tenant|landlord)\b/i.test(
          finding.quote,
        )
      ),
  );
  if (utilitiesVague) {
    score += 1;
    reasons.push("Utility responsibilities are not clearly split.");
  }

  const tenantMajorMaint = input.findings.some(
    (f) =>
      f.category === "maintenance" &&
      /\btenant\b/i.test(f.quote) &&
      /\b(?:structural|hvac|plumbing|electrical|roof)\b/i.test(f.quote),
  );
  if (tenantMajorMaint) {
    score += 1;
    reasons.push("Maintenance language may assign major repairs to the tenant.");
  }

  const entryBroad =
    /\blandlord\b[^.\n]{0,160}\b(?:enter|entry|access)\b[^.\n]{0,160}\b(?:without|at\s+any\s+time)\b/i.test(text);
  if (entryBroad) {
    score += 1;
    reasons.push("Landlord entry language may be broad.");
  }

  const vagueNotice = input.findings.some(
    (f) =>
      f.category === "notice" &&
      /\breasonable\b/i.test(f.quote) &&
      !/\b\d{1,3}\s*days?\b/i.test(f.quote),
  );
  if (vagueNotice) {
    score += 1;
    reasons.push("Notice timing may be unclear.");
  }

  let band: DeterministicRiskBand = "low";
  if (score >= 5) band = "high";
  else if (score >= 2) band = "medium";

  return { score, band, reasons };
}
