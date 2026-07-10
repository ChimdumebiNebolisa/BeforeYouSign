import { runAnalysisPipeline } from "@/lib/analysis/pipeline/run-analysis";
import type { PdfExtractor } from "@/lib/analysis/pipeline/types";
import { getJob, updateJob } from "@/lib/jobs/store";

export async function processAnalysisJob(input: {
  jobId: string;
  request: Request;
  extractPdfTextPages: PdfExtractor;
}): Promise<void> {
  const job = getJob(input.jobId);
  if (!job || job.status === "expired") return;

  updateJob(input.jobId, { status: "processing" });

  try {
    const { response } = await runAnalysisPipeline({
      request: input.request,
      extractPdfTextPages: input.extractPdfTextPages,
    });

    if (response.ok) {
      updateJob(input.jobId, {
        status: "complete",
        resultRequestId: response.requestId,
      });
    } else {
      updateJob(input.jobId, {
        status: "failed",
        failureCode:
          typeof response.error === "string" ? "analysis_failed" : response.error.code,
      });
    }
  } catch {
    updateJob(input.jobId, { status: "failed", failureCode: "analysis_failed" });
  }
}
