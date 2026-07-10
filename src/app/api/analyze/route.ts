import { NextResponse } from "next/server";

import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import type { PdfExtractor } from "@/lib/analysis/pipeline/types";
import { parseAnalysisErrorMessage } from "@/lib/analysis/api-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

let cachedExtractPdfTextPages: PdfExtractor | null = null;

async function getExtractPdfTextPages(): Promise<PdfExtractor> {
  if (cachedExtractPdfTextPages) {
    return cachedExtractPdfTextPages;
  }

  const mod = await import("@/lib/pdf/extract-text");
  cachedExtractPdfTextPages = mod.extractPdfTextPages;
  return cachedExtractPdfTextPages;
}

export async function POST(request: Request) {
  const extractPdfTextPages = await getExtractPdfTextPages();
  const { response, httpStatus } = await runAnalysisPipeline({
    request,
    extractPdfTextPages,
  });

  return NextResponse.json(response, { status: httpStatus });
}
