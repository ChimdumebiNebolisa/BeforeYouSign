import { NextResponse } from "next/server";

import { createJob, isAsyncJobsEnabled } from "@/lib/jobs/store";
import { processAnalysisJob } from "@/lib/jobs/worker";
import type { PdfExtractor } from "@/lib/analysis/pipeline/types";

export const runtime = "nodejs";

let cachedExtractPdfTextPages: PdfExtractor | null = null;

async function getExtractPdfTextPages(): Promise<PdfExtractor> {
  if (cachedExtractPdfTextPages) return cachedExtractPdfTextPages;
  const mod = await import("@/lib/pdf/extract-text");
  cachedExtractPdfTextPages = mod.extractPdfTextPages;
  return cachedExtractPdfTextPages;
}

export async function POST(request: Request) {
  if (!isAsyncJobsEnabled()) {
    return NextResponse.json(
      { ok: false, error: "Async analysis is not enabled. Use POST /api/analyze." },
      { status: 404 },
    );
  }

  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;
  const job = createJob(idempotencyKey);
  if (!job) {
    return NextResponse.json({ ok: false, error: "Unable to create job." }, { status: 503 });
  }

  void processAnalysisJob({
    jobId: job.id,
    request: request.clone(),
    extractPdfTextPages: await getExtractPdfTextPages(),
  });

  return NextResponse.json(
    {
      ok: true,
      jobId: job.id,
      statusUrl: `/api/analyses/${job.id}`,
      expiresAt: new Date(job.expiresAt).toISOString(),
    },
    { status: 202 },
  );
}
