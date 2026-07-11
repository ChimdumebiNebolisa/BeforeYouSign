import { NextResponse } from "next/server";

import { runModelRetryPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { parseModelRetryRequest } from "@/lib/analysis/pipeline/parse-model-retry";
import { createRequestId } from "@/lib/analysis/pipeline/validate-intake";
import { emitSafeAnalysisEvent } from "@/lib/observability/safe-analysis-events";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = createRequestId();
  const startedAt = Date.now();
  const parsed = await parseModelRetryRequest(request);

  if (!parsed.ok) {
    emitSafeAnalysisEvent({
      requestId,
      stage: "validating_input",
      failureCode: parsed.problem.code,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json(
      {
        ok: false,
        requestId,
        stage: "validating_input",
        error: {
          code: parsed.problem.code,
          message: parsed.problem.message,
          ...(parsed.problem.limit !== undefined ? { limit: parsed.problem.limit } : {}),
          ...(parsed.problem.actual !== undefined ? { actual: parsed.problem.actual } : {}),
        },
      },
      { status: parsed.problem.httpStatus },
    );
  }

  const { response, httpStatus } = await runModelRetryPipeline({
    request,
    retry: parsed.retry,
  });

  return NextResponse.json(response, { status: httpStatus });
}
