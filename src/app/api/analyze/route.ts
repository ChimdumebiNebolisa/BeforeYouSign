import { NextResponse } from "next/server";

import { runStructuredLeaseAnalysis } from "@/lib/analysis/gemini-report";
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
  type RuleBasedFinding,
} from "@/lib/analysis/rules";
import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import { computeDeterministicLeaseRisk, type DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { getBysAiKey } from "@/lib/env/bys-ai-key";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

export const runtime = "nodejs";
export const maxDuration = 60;

const isDev = process.env.NODE_ENV === "development";

type ExtractPdfTextPagesFn = (arrayBuffer: ArrayBuffer) => Promise<{ page: number; text: string }[]>;

let cachedExtractPdfTextPages: ExtractPdfTextPagesFn | null = null;

async function getExtractPdfTextPages(): Promise<ExtractPdfTextPagesFn> {
  if (cachedExtractPdfTextPages) {
    return cachedExtractPdfTextPages;
  }

  // Load PDF parser lazily so text-only analysis requests don't evaluate pdf-parse on server boot.
  const mod = await import("@/lib/pdf/extract-text");
  cachedExtractPdfTextPages = mod.extractPdfTextPages;
  return cachedExtractPdfTextPages;
}

function extractCurrencyValue(text: string): string | null {
  const match = text.match(/\$[\d,]+(?:\.\d{2})?/);
  return match ? match[0] : null;
}

function extractDayWindow(text: string): string | null {
  const match = text.match(/\b\d{1,3}\s*(?:calendar\s+)?days?\b/i);
  return match ? match[0] : null;
}

function normalizeQuoteKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"']/g, "")
    .trim();
}

function shortClause(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  const slice = normalized.slice(0, maxChars);
  const breakAt = slice.lastIndexOf(" ");
  const base = breakAt > maxChars * 0.55 ? slice.slice(0, breakAt).trimEnd() : slice.trimEnd();
  return `${base}...`;
}

function feeLabelFromQuote(quote: string): string {
  const q = quote.toLowerCase();
  if (q.includes("late")) return "Late fee";
  if (q.includes("deposit")) return "Deposit-related fee";
  if (q.includes("pet")) return "Pet fee";
  if (q.includes("parking")) return "Parking fee";
  if (q.includes("clean")) return "Cleaning fee";
  return "Additional fee";
}

function fallbackFlagTitle(category: RuleBasedFinding["category"]): string {
  switch (category) {
    case "fees":
    case "deposit":
      return "Extra fee terms to review";
    case "renewal":
      return "Renewal terms may limit flexibility";
    case "notice":
      return "Notice requirements may be strict";
    case "maintenance":
      return "Maintenance duties may shift costs to you";
    case "utilities":
      return "Utility cost responsibilities may be unclear";
    default:
      return "Lease clause to review";
  }
}

function fallbackFlagExplanation(category: RuleBasedFinding["category"]): string {
  switch (category) {
    case "fees":
    case "deposit":
      return "This clause suggests charges beyond monthly rent.";
    case "renewal":
      return "This clause may affect how and when your lease renews.";
    case "notice":
      return "This clause sets or implies deadlines for giving notice.";
    case "maintenance":
      return "This clause may assign repair or upkeep duties to the tenant.";
    case "utilities":
      return "This clause may affect which utilities you must pay for.";
    default:
      return "This clause may affect your costs or lease obligations.";
  }
}

function fallbackFlagWhyItMatters(category: RuleBasedFinding["category"]): string {
  switch (category) {
    case "fees":
    case "deposit":
      return "Unexpected fees can raise your total housing cost.";
    case "renewal":
      return "Renewal terms can affect move-out timing and flexibility.";
    case "notice":
      return "Missing a notice deadline can trigger extra rent obligations.";
    case "maintenance":
      return "Repair duties can create unexpected out-of-pocket costs.";
    case "utilities":
      return "Utility responsibility changes your true monthly cost.";
    default:
      return "Clarifying this clause helps avoid surprises later.";
  }
}

function buildRuleOnlyFallbackReport(input: {
  fullLeaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
}): BeforeYouSignReport {
  const byCategory: Record<RuleBasedFinding["category"], RuleBasedFinding[]> = {
    rent: [],
    deposit: [],
    fees: [],
    notice: [],
    renewal: [],
    maintenance: [],
    utilities: [],
  };

  const seenCategoryQuotes = new Set<string>();

  for (const finding of input.ruleBasedFindings) {
    const key = `${finding.category}::${normalizeQuoteKey(finding.quote)}`;
    if (seenCategoryQuotes.has(key)) continue;
    seenCategoryQuotes.add(key);
    byCategory[finding.category].push(finding);
  }

  const moneyAndFees: { label: string; value: string; evidence?: { page: number; quote: string }[] }[] = [];
  const rentFinding = byCategory.rent[0];
  if (rentFinding) {
    moneyAndFees.push({
      label: "Monthly Rent",
      value: extractCurrencyValue(rentFinding.quote) ?? "See lease clause",
      evidence: [{ page: rentFinding.page, quote: rentFinding.quote }],
    });
  }

  const depositFinding = byCategory.deposit[0];
  if (depositFinding) {
    moneyAndFees.push({
      label: "Security Deposit",
      value: extractCurrencyValue(depositFinding.quote) ?? "See lease clause",
      evidence: [{ page: depositFinding.page, quote: depositFinding.quote }],
    });
  }

  for (const feeFinding of byCategory.fees.slice(0, 4)) {
    moneyAndFees.push({
      label: feeLabelFromQuote(feeFinding.quote),
      value: extractCurrencyValue(feeFinding.quote) ?? "See lease clause",
      evidence: [{ page: feeFinding.page, quote: feeFinding.quote }],
    });
  }

  const deadlinesAndNotice: { label: string; value: string; evidence?: { page: number; quote: string }[] }[] = [];
  for (const noticeFinding of byCategory.notice.slice(0, 2)) {
    deadlinesAndNotice.push({
      label: "Notice Requirement",
      value: extractDayWindow(noticeFinding.quote) ?? "Review notice clause",
      evidence: [{ page: noticeFinding.page, quote: noticeFinding.quote }],
    });
  }
  for (const renewalFinding of byCategory.renewal.slice(0, 2)) {
    deadlinesAndNotice.push({
      label: "Renewal Terms",
      value: /month-?to-?month/i.test(renewalFinding.quote)
        ? "Potential month-to-month renewal"
        : "Review renewal clause",
      evidence: [{ page: renewalFinding.page, quote: renewalFinding.quote }],
    });
  }

  const responsibilities = [
    ...byCategory.utilities.slice(0, 2).map((f) => `Utilities: ${shortClause(f.quote, 140)}`),
    ...byCategory.maintenance.slice(0, 2).map((f) => `Maintenance: ${shortClause(f.quote, 140)}`),
  ];
  if (responsibilities.length === 0) {
    responsibilities.push("Tenant and landlord responsibilities were not clearly separated.");
  }

  const whatYoureAgreeingTo = Array.from(
    new Set([
      ...moneyAndFees.slice(0, 3).map((row) => `${row.label}: ${row.value}`),
      ...deadlinesAndNotice.slice(0, 2).map((row) => `${row.label}: ${row.value}`),
      ...responsibilities.slice(0, 2),
    ]),
  );

  const categoryMap: Record<RuleBasedFinding["category"], "fees" | "notice" | "renewal" | "maintenance" | "utilities"> = {
    rent: "fees",
    deposit: "fees",
    fees: "fees",
    notice: "notice",
    renewal: "renewal",
    maintenance: "maintenance",
    utilities: "utilities",
  };

  const redFlagCandidates = [
    ...byCategory.fees,
    ...byCategory.deposit,
    ...byCategory.renewal,
    ...byCategory.notice,
    ...byCategory.maintenance,
    ...byCategory.utilities,
  ];

  const seenFlagQuotes = new Set<string>();

  const potentialRedFlags = redFlagCandidates
    .filter((f) => {
      const key = normalizeQuoteKey(f.quote);
      if (seenFlagQuotes.has(key)) return false;
      seenFlagQuotes.add(key);
      return true;
    })
    .slice(0, 4)
    .map((f, index) => {
      const severity: "minor" | "moderate" | "critical" =
        input.deterministicRisk.band === "high" && (f.category === "fees" || f.category === "renewal")
          ? "critical"
          : input.deterministicRisk.band === "medium"
            ? "moderate"
            : "minor";

      return {
        id: `rule-flag-${index + 1}`,
        category: categoryMap[f.category],
        title: fallbackFlagTitle(f.category),
        severity,
        explanation: fallbackFlagExplanation(f.category),
        whyItMatters: fallbackFlagWhyItMatters(f.category),
        evidence: [{ page: f.page, quote: f.quote }],
      };
    });

  const questionsToAsk = Array.from(
    new Set([
      ...(moneyAndFees.length > 1
        ? ["Can you list every required fee and explain when each one applies?"]
        : []),
      ...(byCategory.notice.length > 0 || byCategory.renewal.length > 0
        ? ["What notice period do I need to move out or avoid automatic renewal?"]
        : []),
      ...(byCategory.utilities.length > 0
        ? ["Which utilities are included in rent, and which ones do I pay directly?"]
        : []),
      ...(byCategory.maintenance.length > 0
        ? ["Which repairs are my responsibility versus the landlord's?"]
        : []),
      "Can we get any unclear terms clarified in writing before I sign?",
    ]),
  ).slice(0, 5);

  const missingOrUnclear: string[] = [];
  if (byCategory.notice.length === 0) {
    missingOrUnclear.push("Notice timing was not clearly stated.");
  }
  if (byCategory.renewal.length === 0) {
    missingOrUnclear.push("Renewal terms were not clearly stated.");
  }
  if (byCategory.utilities.length === 0) {
    missingOrUnclear.push("Utility responsibility was not clearly stated.");
  }
  if (byCategory.maintenance.length === 0) {
    missingOrUnclear.push("Maintenance responsibility was not clearly stated.");
  }
  if (missingOrUnclear.length === 0) {
    missingOrUnclear.push("Some terms may still need clarification in the full lease document.");
  }

  const summary =
    moneyAndFees.length > 0
      ? "We reviewed your lease and highlighted key costs, deadlines, and responsibilities."
      : "We reviewed your lease and highlighted the main terms to check before signing.";

  const fallbackRiskReason =
    input.deterministicRisk.reasons.length > 0
      ? input.deterministicRisk.reasons.slice(0, 3).join(" ")
      : "Risk level is based on lease terms we could confirm from this document.";

  return {
    summary,
    whatYoureAgreeingTo,
    riskLevel: input.deterministicRisk.band,
    riskReason: fallbackRiskReason,
    moneyAndFees,
    deadlinesAndNotice,
    responsibilities,
    potentialRedFlags,
    questionsToAsk,
    nextSteps: [
      "Confirm the total monthly cost, including recurring fees.",
      "Ask for written clarification on any unclear lease terms.",
      "Get legal advice before signing if any clause feels risky or unclear.",
    ],
    missingOrUnclear,
    disclaimer:
      "This information is for informational purposes only and not legal advice. Consult a legal professional for advice.",
  };
}

async function buildLeaseAiFields(input: {
  fullLeaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
}): Promise<{
  report: BeforeYouSignReport | null;
  reportError: string | null;
  reportDebug: { rawModelResponse?: string; failureStage?: string } | null;
}> {
  const apiKey = getBysAiKey();
  if (!apiKey?.trim()) {
    return {
      report: null,
      reportError: "The AI summary isn't available right now, but key lease details are still shown below.",
      reportDebug: null,
    };
  }

  const ai = await runStructuredLeaseAnalysis({
    apiKey: apiKey.trim(),
    leaseText: input.fullLeaseText,
    ruleBasedFindings: input.ruleBasedFindings,
    deterministicRisk: input.deterministicRisk,
  });

  if (ai.ok) {
    return { report: ai.report, reportError: null, reportDebug: null };
  }

  const fallbackReport = buildRuleOnlyFallbackReport(input);

  const reportDebug =
    isDev && ai.rawText !== undefined
      ? {
          rawModelResponse: ai.rawText.length > 48_000 ? ai.rawText.slice(0, 48_000) + "…" : ai.rawText,
          failureStage: ai.failureStage,
        }
      : isDev
        ? { failureStage: ai.failureStage }
        : null;

  return { report: fallbackReport, reportError: null, reportDebug };
}

export async function POST(request: Request) {
  const headerContentType = (request.headers.get("content-type") ?? "").toLowerCase();

  try {
    if (headerContentType.includes("application/json")) {
      try {
        let parsed: unknown;
        try {
          parsed = await request.json();
        } catch {
          return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
        }

        if (!parsed || typeof parsed !== "object" || !("leaseText" in parsed)) {
          return NextResponse.json(
            { ok: false, error: "Missing leaseText in JSON body." },
            { status: 400 },
          );
        }

        const rawText = (parsed as { leaseText: unknown }).leaseText;
        if (typeof rawText !== "string") {
          return NextResponse.json(
            { ok: false, error: "leaseText must be a string." },
            { status: 400 },
          );
        }

        const normalizedText = normalizeLeasePageText(rawText);
        if (!normalizedText) {
          return NextResponse.json(
            { ok: false, error: "leaseText is empty after normalization." },
            { status: 400 },
          );
        }

        const fileNameField = (parsed as { fileName?: unknown }).fileName;
        const fileName =
          typeof fileNameField === "string" && fileNameField.trim().length > 0
            ? fileNameField.trim()
            : "pasted-lease.txt";

        const extractedPages = [{ page: 1, text: normalizedText }];
        const rentSnippets = findRentSnippets(extractedPages);
        const depositSnippets = findDepositSnippets(extractedPages);
        const feeSnippets = findFeeSnippets(extractedPages);
        const noticeSnippets = findNoticeSnippets(extractedPages);
        const renewalSnippets = findRenewalSnippets(extractedPages);
        const maintenanceSnippets = findMaintenanceSnippets(extractedPages);
        const utilitiesSnippets = findUtilitiesSnippets(extractedPages);
        const ruleBasedFindings = buildRuleBasedFindings({
          rent: rentSnippets,
          deposit: depositSnippets,
          fees: feeSnippets,
          notice: noticeSnippets,
          renewal: renewalSnippets,
          maintenance: maintenanceSnippets,
          utilities: utilitiesSnippets,
        });
        const unclearLeasePhrases = findUnclearLeasePhrases(extractedPages);
        const fullLeaseText = extractedPages.map((p) => p.text).join("\n\n");
        const deterministicRisk = computeDeterministicLeaseRisk({
          fullText: fullLeaseText,
          findings: ruleBasedFindings,
          unclearPhrases: unclearLeasePhrases,
        });
        const fileSizeBytes = Buffer.byteLength(normalizedText, "utf8");

        if (process.env.BEFOREYOUSIGN_PDF_DEBUG === "1") {
          console.log(
            "[beforeyousign][text] normalized",
            JSON.stringify({
              fileName,
              pages: extractedPages.length,
              charsPerPage: extractedPages.map((p) => p.text.length),
              rentSnippets: rentSnippets.length,
              depositSnippets: depositSnippets.length,
              feeSnippets: feeSnippets.length,
              noticeSnippets: noticeSnippets.length,
              renewalSnippets: renewalSnippets.length,
              maintenanceSnippets: maintenanceSnippets.length,
              utilitiesSnippets: utilitiesSnippets.length,
              ruleBasedFindings: ruleBasedFindings.length,
              unclearLeasePhrases: unclearLeasePhrases.length,
              hasBysAiKey: Boolean(getBysAiKey()),
            }),
          );
        }

        const aiFields = await buildLeaseAiFields({
          fullLeaseText,
          ruleBasedFindings,
          deterministicRisk,
        });

        return NextResponse.json({
          ok: true,
          fileName,
          fileSizeBytes,
          contentType: "text/plain",
          extractedPages,
          rentSnippets,
          depositSnippets,
          feeSnippets,
          noticeSnippets,
          renewalSnippets,
          maintenanceSnippets,
          utilitiesSnippets,
          ruleBasedFindings,
          unclearLeasePhrases,
          deterministicRiskScore: deterministicRisk.score,
          deterministicRiskBand: deterministicRisk.band,
          deterministicRiskReasons: deterministicRisk.reasons,
          report: aiFields.report,
          reportError: aiFields.reportError,
          ...(isDev && aiFields.reportDebug ? { reportDebug: aiFields.reportDebug } : {}),
        });
      } catch (error) {
        if (isDev) {
          console.error("[beforeyousign][analyze][json] unexpected error", error);
        }
        return NextResponse.json(
          {
            ok: false,
            error: "We hit an unexpected server error while analyzing this text. Please retry.",
          },
          { status: 500 },
        );
      }
    }

    if (!headerContentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unsupported content type. Use application/json for pasted text or multipart/form-data for PDF upload.",
        },
        { status: 415 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Missing file. Expected multipart form field 'file'." },
        { status: 400 },
      );
    }

    const fileName = (file as unknown as { name?: string }).name ?? "uploaded.pdf";
    const fileSizeBytes = file.size;
    const contentType = file.type || null;

    try {
      const extractPdfTextPages = await getExtractPdfTextPages();
      const bytes = await file.arrayBuffer();
      const extractedPages = await extractPdfTextPages(bytes);
      const rentSnippets = findRentSnippets(extractedPages);
      const depositSnippets = findDepositSnippets(extractedPages);
      const feeSnippets = findFeeSnippets(extractedPages);
      const noticeSnippets = findNoticeSnippets(extractedPages);
      const renewalSnippets = findRenewalSnippets(extractedPages);
      const maintenanceSnippets = findMaintenanceSnippets(extractedPages);
      const utilitiesSnippets = findUtilitiesSnippets(extractedPages);
      const ruleBasedFindings = buildRuleBasedFindings({
        rent: rentSnippets,
        deposit: depositSnippets,
        fees: feeSnippets,
        notice: noticeSnippets,
        renewal: renewalSnippets,
        maintenance: maintenanceSnippets,
        utilities: utilitiesSnippets,
      });
      const unclearLeasePhrases = findUnclearLeasePhrases(extractedPages);
      const fullLeaseText = extractedPages.map((p) => p.text).join("\n\n");
      const deterministicRisk = computeDeterministicLeaseRisk({
        fullText: fullLeaseText,
        findings: ruleBasedFindings,
        unclearPhrases: unclearLeasePhrases,
      });

      if (process.env.BEFOREYOUSIGN_PDF_DEBUG === "1") {
        console.log(
          "[beforeyousign][pdf] extracted",
          JSON.stringify({
            fileName,
            pages: extractedPages.length,
            charsPerPage: extractedPages.map((p) => p.text.length),
            rentSnippets: rentSnippets.length,
            depositSnippets: depositSnippets.length,
            feeSnippets: feeSnippets.length,
            noticeSnippets: noticeSnippets.length,
            renewalSnippets: renewalSnippets.length,
            maintenanceSnippets: maintenanceSnippets.length,
            utilitiesSnippets: utilitiesSnippets.length,
            ruleBasedFindings: ruleBasedFindings.length,
            unclearLeasePhrases: unclearLeasePhrases.length,
            hasBysAiKey: Boolean(getBysAiKey()),
          }),
        );
      }

      const aiFields = await buildLeaseAiFields({
        fullLeaseText,
        ruleBasedFindings,
        deterministicRisk,
      });

      return NextResponse.json({
        ok: true,
        fileName,
        fileSizeBytes,
        contentType,
        extractedPages,
        rentSnippets,
        depositSnippets,
        feeSnippets,
        noticeSnippets,
        renewalSnippets,
        maintenanceSnippets,
        utilitiesSnippets,
        ruleBasedFindings,
        unclearLeasePhrases,
        deterministicRiskScore: deterministicRisk.score,
        deterministicRiskBand: deterministicRisk.band,
        deterministicRiskReasons: deterministicRisk.reasons,
        report: aiFields.report,
        reportError: aiFields.reportError,
        ...(isDev && aiFields.reportDebug ? { reportDebug: aiFields.reportDebug } : {}),
      });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to extract text from this PDF.",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    if (isDev) {
      console.error("[beforeyousign][analyze] unhandled route error", {
        contentType: headerContentType || "(empty)",
        error,
      });
    }
    return NextResponse.json(
      {
        ok: false,
        error: "We hit an unexpected server error while processing this request. Please retry.",
      },
      { status: 500 },
    );
  }
}

