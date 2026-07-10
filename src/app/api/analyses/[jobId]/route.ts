import { NextResponse } from "next/server";

import { getJob, isAsyncJobsEnabled } from "@/lib/jobs/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  if (!isAsyncJobsEnabled()) {
    return NextResponse.json({ ok: false, error: "Async analysis is not enabled." }, { status: 404 });
  }

  const { jobId } = await context.params;
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    status: job.status,
    expiresAt: new Date(job.expiresAt).toISOString(),
    resultRequestId: job.resultRequestId ?? null,
    failureCode: job.failureCode ?? null,
  });
}
