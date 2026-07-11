import type { AnalysisStage } from "@/lib/analysis/pipeline/stages";

export type SafeAnalysisEvent = {
  requestId: string;
  stage: AnalysisStage;
  mode?: string;
  durationMs?: number;
  pageCount?: number;
  totalChars?: number;
  failureCode?: string;
  droppedClaims?: number;
  groundedClaims?: number;
};

const SENSITIVE_PATTERNS = [
  /\$[\d,]+/,
  /rent/i,
  /deposit/i,
  /lease/i,
  /tenant/i,
  /landlord/i,
];

function containsSensitiveContent(value: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(value));
}

function sanitizeEvent(event: SafeAnalysisEvent): SafeAnalysisEvent {
  const sanitized: SafeAnalysisEvent = { ...event };
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === "string" && containsSensitiveContent(value)) {
      (sanitized as Record<string, unknown>)[key] = "[redacted]";
    }
  }
  return sanitized;
}

export function emitSafeAnalysisEvent(event: SafeAnalysisEvent): void {
  const sanitized = sanitizeEvent(event);
  if (process.env.NODE_ENV === "development") {
    console.log("[beforeyousign][event]", JSON.stringify(sanitized));
  }
}

export function redactForLogs(value: string, maxLength = 0): string {
  if (!value) return "";
  if (containsSensitiveContent(value)) return "[redacted]";
  if (maxLength > 0 && value.length > maxLength) {
    return `${value.slice(0, maxLength)}…`;
  }
  return value;
}
