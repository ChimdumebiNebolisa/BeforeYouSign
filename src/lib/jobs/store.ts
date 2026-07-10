import { randomUUID } from "node:crypto";

import type { AnalysisJob } from "@/lib/jobs/types";
import { shouldOfferAsyncJobs } from "@/lib/rollout/flags";

const TTL_MS = 30 * 60 * 1000;
const jobs = new Map<string, AnalysisJob>();

export function isAsyncJobsEnabled(): boolean {
  return shouldOfferAsyncJobs();
}

export function createJob(idempotencyKey?: string): AnalysisJob | null {
  if (!isAsyncJobsEnabled()) return null;

  if (idempotencyKey) {
    for (const job of jobs.values()) {
      if (job.idempotencyKey === idempotencyKey && job.status !== "expired") {
        return job;
      }
    }
  }

  const now = Date.now();
  const job: AnalysisJob = {
    id: randomUUID(),
    status: "queued",
    createdAt: now,
    updatedAt: now,
    expiresAt: now + TTL_MS,
    idempotencyKey,
  };
  jobs.set(job.id, job);
  return job;
}

export function getJob(jobId: string): AnalysisJob | null {
  const job = jobs.get(jobId);
  if (!job) return null;
  if (job.expiresAt < Date.now()) {
    job.status = "expired";
    jobs.set(jobId, job);
  }
  return job;
}

export function updateJob(jobId: string, patch: Partial<AnalysisJob>): AnalysisJob | null {
  const job = getJob(jobId);
  if (!job) return null;
  const updated = { ...job, ...patch, updatedAt: Date.now() };
  jobs.set(jobId, updated);
  return updated;
}
