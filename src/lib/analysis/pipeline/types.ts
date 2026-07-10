import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

export type AnalysisMode = "model_grounded" | "rules_only" | "unavailable";

export type ExtractionMethod = "embedded_text" | "ocr" | "pasted_text";

export type CoverageStatus = "complete" | "partial" | "unreadable";

export type DocumentExtraction = {
  method: ExtractionMethod;
  pageCount: number;
  totalChars: number;
  quality: number;
  coverageStatus: CoverageStatus;
  ocrPagesAttempted?: number;
  ocrPagesFailed?: number;
};

export type NormalizedDocument = {
  documentId: string;
  pages: ExtractedTextPage[];
  extraction: DocumentExtraction;
};

export type AnalysisInput =
  | { kind: "text"; leaseText: string; fileName: string }
  | { kind: "pdf"; bytes: ArrayBuffer; fileName: string; contentType: string | null };

export type DeterministicAnalysis = {
  rentSnippets: { page: number; quote: string }[];
  depositSnippets: { page: number; quote: string }[];
  feeSnippets: { page: number; quote: string }[];
  noticeSnippets: { page: number; quote: string }[];
  renewalSnippets: { page: number; quote: string }[];
  maintenanceSnippets: { page: number; quote: string }[];
  utilitiesSnippets: { page: number; quote: string }[];
  ruleBasedFindings: RuleBasedFinding[];
  unclearLeasePhrases: { page: number; quote: string }[];
  texasRenterFindings: TexasRenterFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  fullLeaseText: string;
};

export type GroundingSummary = {
  materialClaims: number;
  groundedClaims: number;
  droppedClaims: number;
};

export type AnalysisSuccessResponse = {
  ok: true;
  analysisVersion: number;
  mode: AnalysisMode;
  requestId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string | null;
  document: {
    extraction: DocumentExtraction;
  };
  extractedPages: ExtractedTextPage[];
  rentSnippets: DeterministicAnalysis["rentSnippets"];
  depositSnippets: DeterministicAnalysis["depositSnippets"];
  feeSnippets: DeterministicAnalysis["feeSnippets"];
  noticeSnippets: DeterministicAnalysis["noticeSnippets"];
  renewalSnippets: DeterministicAnalysis["renewalSnippets"];
  maintenanceSnippets: DeterministicAnalysis["maintenanceSnippets"];
  utilitiesSnippets: DeterministicAnalysis["utilitiesSnippets"];
  ruleBasedFindings: RuleBasedFinding[];
  unclearLeasePhrases: DeterministicAnalysis["unclearLeasePhrases"];
  texasRenterFindings: TexasRenterFinding[];
  deterministicRiskScore: number;
  deterministicRiskBand: DeterministicLeaseRisk["band"];
  deterministicRiskReasons: string[];
  report: BeforeYouSignReport | null;
  reportError: string | null;
  groundingSummary?: GroundingSummary;
  reportDebug?: { failureStage?: string } | null;
};

export type AnalysisErrorResponse = {
  ok: false;
  requestId?: string;
  error:
    | string
    | {
        code: string;
        message: string;
        limit?: number;
        actual?: number;
      };
};

export type AnalysisResponse = AnalysisSuccessResponse | AnalysisErrorResponse;

export type ModelAnalyzerResult = {
  report: BeforeYouSignReport | null;
  reportError: string | null;
  mode: AnalysisMode;
  groundingSummary?: GroundingSummary;
  reportDebug?: { failureStage?: string } | null;
};

export type ModelAnalyzer = (input: {
  document: NormalizedDocument;
  deterministic: DeterministicAnalysis;
}) => Promise<ModelAnalyzerResult>;

export type PdfExtractor = (bytes: ArrayBuffer) => Promise<ExtractedTextPage[]>;
