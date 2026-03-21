import { NextResponse } from "next/server";

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
import { getBysAiKey } from "@/lib/env/bys-ai-key";
import { extractPdfTextPages } from "@/lib/pdf/extract-text";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headerContentType = request.headers.get("content-type") ?? "";

  if (headerContentType.includes("application/json")) {
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
    });
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
}

