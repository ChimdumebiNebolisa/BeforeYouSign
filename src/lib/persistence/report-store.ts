import { createHash, randomBytes } from "node:crypto";

import type { AnalysisSuccessResponse } from "@/lib/analysis/pipeline/types";
import { shouldOfferRecovery } from "@/lib/rollout/flags";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const reports = new Map<
  string,
  { payload: AnalysisSuccessResponse; expiresAt: number; createdAt: number }
>();

export function isRecoveryEnabled(): boolean {
  return shouldOfferRecovery();
}

export function issueRecoveryToken(payload: AnalysisSuccessResponse): string | null {
  if (!isRecoveryEnabled()) return null;
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  reports.set(token, {
    payload,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
  });
  return token;
}

export function getRecoveredReport(token: string): AnalysisSuccessResponse | null {
  const entry = reports.get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    reports.delete(token);
    return null;
  }
  return entry.payload;
}

export function deleteRecoveredReport(token: string): boolean {
  return reports.delete(token);
}

export function hashRecoveryToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
