export const ANALYSIS_LIMITS = {
  maxPdfBytes: 10 * 1024 * 1024,
  maxPages: 100,
  maxChars: 120_000,
  maxEvidenceChunks: 500,
  maxModelInputChunks: 200,
  maxConcurrentPerClient: 1,
  maxProviderRetries: 1,
  lowExtractionCharThreshold: 400,
  ocrQualityThreshold: 0.35,
} as const;

export type AnalysisProblemCode =
  | "invalid_input"
  | "payload_too_large"
  | "too_many_pages"
  | "too_many_chars"
  | "unsupported_media_type"
  | "extraction_failed"
  | "extraction_empty"
  | "rate_limited"
  | "provider_timeout"
  | "analysis_failed";

export type AnalysisProblem = {
  code: AnalysisProblemCode;
  message: string;
  httpStatus: number;
  limit?: number;
  actual?: number;
};

export function createAnalysisProblem(
  code: AnalysisProblemCode,
  message: string,
  options?: { limit?: number; actual?: number },
): AnalysisProblem {
  const httpStatus = (() => {
    switch (code) {
      case "payload_too_large":
      case "too_many_pages":
      case "too_many_chars":
        return 413;
      case "unsupported_media_type":
      case "invalid_input":
        return 400;
      case "extraction_failed":
      case "extraction_empty":
        return 422;
      case "rate_limited":
        return 429;
      case "provider_timeout":
        return 504;
      default:
        return 500;
    }
  })();

  return {
    code,
    message,
    httpStatus,
    ...options,
  };
}
