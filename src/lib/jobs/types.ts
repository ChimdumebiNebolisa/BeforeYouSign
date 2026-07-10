export type AnalysisJobStatus = "queued" | "processing" | "complete" | "failed" | "expired";

export type AnalysisJob = {
  id: string;
  status: AnalysisJobStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  idempotencyKey?: string;
  resultRequestId?: string;
  failureCode?: string;
};
