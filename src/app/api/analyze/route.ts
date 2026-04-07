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

  for (const finding of input.ruleBasedFindings) {
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
      label: "Additional Fee",
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
    ...byCategory.utilities.slice(0, 2).map((f) => `Utilities: ${f.quote}`),
    ...byCategory.maintenance.slice(0, 2).map((f) => `Maintenance: ${f.quote}`),
  ];
  if (responsibilities.length === 0) {
    responsibilities.push("Review tenant and landlord responsibility clauses in the lease.");
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

  const potentialRedFlags = input.ruleBasedFindings
    .filter((f) => f.category !== "rent")
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
        title: `${f.category[0].toUpperCase()}${f.category.slice(1)} clause to review`,
        severity,
        explanation: "This clause was identified by rule-based scanning and may affect tenant obligations or costs.",
        whyItMatters: "Clarifying this clause can reduce the risk of unexpected fees or constraints.",
        evidence: [{ page: f.page, quote: f.quote }],
      };
    });

  const questionsToAsk: string[] = [
    "Can you clarify any fees, penalties, and when they apply?",
    "What are the exact notice and renewal requirements?",
    "Which utilities and maintenance duties are the tenant's responsibility?",
  ];

  const missingOrUnclear: string[] = [];
  if (byCategory.notice.length === 0) missingOrUnclear.push("Notice period details are unclear.");
  if (byCategory.renewal.length === 0) missingOrUnclear.push("Renewal terms are not clearly identified.");
  if (byCategory.utilities.length === 0) missingOrUnclear.push("Utility responsibilities are unclear.");
  if (byCategory.maintenance.length === 0) missingOrUnclear.push("Maintenance responsibilities are unclear.");
  if (missingOrUnclear.length === 0) {
    missingOrUnclear.push("Review the full lease for any clauses not captured by rule-based extraction.");
  }

  const summary =
    moneyAndFees.length > 0
      ? "This report is based on extracted lease clauses and highlights key payments, deadlines, and obligations."
      : "This report is based on extracted lease clauses and highlights key terms to review before signing.";

  return {
    summary,
    whatYoureAgreeingTo,
    riskLevel: input.deterministicRisk.band,
    riskReason:
      input.deterministicRisk.reasons.length > 0
        ? input.deterministicRisk.reasons.join(" ")
        : "Risk level is based on rule-based clause detection from extracted lease text.",
    moneyAndFees,
    deadlinesAndNotice,
    responsibilities,
    potentialRedFlags,
    questionsToAsk,
    nextSteps: [
      "Review the highlighted clauses directly in the lease text.",
      "Ask the landlord or property manager to clarify unclear terms in writing.",
      "Get legal advice for high-impact clauses before signing.",
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
      reportError:
        "Structured AI report skipped: add BYS_AI_KEY to .env.local on the server (never use NEXT_PUBLIC_).",
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

