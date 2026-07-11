import { NextResponse } from "next/server";

import { runModelRetryPipeline } from "@/lib/analysis/pipeline/run-analysis";
import { parseModelRetryInput } from "@/lib/analysis/pipeline/validate-intake";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = await parseModelRetryInput(request);
  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
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
