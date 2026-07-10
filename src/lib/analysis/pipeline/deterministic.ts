import {
  buildRuleBasedFindings,
  findDepositSnippets,
  findFeeSnippets,
  findMaintenanceSnippets,
  findNoticeSnippets,
  findRenewalSnippets,
  findRentSnippets,
  findUnclearLeasePhrases,
  findUtilitiesSnippets,
} from "@/lib/analysis/rules";
import { computeDeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { scanTexasRenterTopics } from "@/lib/legal-reference/texas-renter-scan";
import type { DeterministicAnalysis } from "@/lib/analysis/pipeline/types";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

export function runDeterministicAnalysis(pages: ExtractedTextPage[]): DeterministicAnalysis {
  const rentSnippets = findRentSnippets(pages);
  const depositSnippets = findDepositSnippets(pages);
  const feeSnippets = findFeeSnippets(pages);
  const noticeSnippets = findNoticeSnippets(pages);
  const renewalSnippets = findRenewalSnippets(pages);
  const maintenanceSnippets = findMaintenanceSnippets(pages);
  const utilitiesSnippets = findUtilitiesSnippets(pages);
  const ruleBasedFindings = buildRuleBasedFindings({
    rent: rentSnippets,
    deposit: depositSnippets,
    fees: feeSnippets,
    notice: noticeSnippets,
    renewal: renewalSnippets,
    maintenance: maintenanceSnippets,
    utilities: utilitiesSnippets,
  });
  const unclearLeasePhrases = findUnclearLeasePhrases(pages);
  const texasRenterFindings = scanTexasRenterTopics(pages);
  const fullLeaseText = pages.map((p) => p.text).join("\n\n");
  const deterministicRisk = computeDeterministicLeaseRisk({
    fullText: fullLeaseText,
    findings: ruleBasedFindings,
    unclearPhrases: unclearLeasePhrases,
  });

  return {
    rentSnippets,
    depositSnippets,
    feeSnippets,
    noticeSnippets,
    renewalSnippets,
    maintenanceSnippets,
    utilitiesSnippets,
    ruleBasedFindings,
    unclearLeasePhrases,
    texasRenterFindings,
    deterministicRisk,
    fullLeaseText,
  };
}
