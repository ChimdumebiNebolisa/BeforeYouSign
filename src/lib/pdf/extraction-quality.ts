import type { ExtractedTextPage } from "@/lib/pdf/extract-text";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";
import type { CoverageStatus, DocumentExtraction } from "@/lib/analysis/pipeline/types";

export type ExtractionQuality = {
  totalChars: number;
  nonWhitespaceChars: number;
  avgCharsPerPage: number;
  emptyPageRatio: number;
  quality: number;
  coverageStatus: CoverageStatus;
  likelyScanned: boolean;
};

export function assessExtractionQuality(pages: ExtractedTextPage[]): ExtractionQuality {
  const pageCount = pages.length || 1;
  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0);
  const nonWhitespaceChars = pages.reduce(
    (sum, p) => sum + p.text.replace(/\s+/g, "").length,
    0,
  );
  const emptyPages = pages.filter((p) => p.text.trim().length === 0).length;
  const emptyPageRatio = emptyPages / pageCount;
  const avgCharsPerPage = totalChars / pageCount;

  let quality = Math.min(1, nonWhitespaceChars / Math.max(1, pageCount * 500));
  if (avgCharsPerPage < ANALYSIS_LIMITS.lowExtractionCharThreshold) {
    quality *= 0.5;
  }
  if (emptyPageRatio > 0.5) {
    quality *= 0.4;
  }

  const likelyScanned = avgCharsPerPage < ANALYSIS_LIMITS.lowExtractionCharThreshold;

  let coverageStatus: CoverageStatus = "complete";
  if (likelyScanned || quality < ANALYSIS_LIMITS.ocrQualityThreshold) {
    coverageStatus = totalChars > 0 ? "partial" : "unreadable";
  }

  return {
    totalChars,
    nonWhitespaceChars,
    avgCharsPerPage,
    emptyPageRatio,
    quality,
    coverageStatus,
    likelyScanned,
  };
}

export function toDocumentExtraction(
  method: DocumentExtraction["method"],
  pages: ExtractedTextPage[],
  quality: ExtractionQuality,
): DocumentExtraction {
  return {
    method,
    pageCount: pages.length,
    totalChars: quality.totalChars,
    quality: quality.quality,
    coverageStatus: quality.coverageStatus,
  };
}
