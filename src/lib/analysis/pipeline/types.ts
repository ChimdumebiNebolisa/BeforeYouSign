import type { BeforeYouSignReport } from "@/lib/analysis/schema";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import type { EvidenceIndex } from "@/lib/evidence/index";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";
import type { AnalysisStage } from "@/lib/analysis/pipeline/stages";
import type { StateCode, StateGuidanceStatus } from "@/lib/jurisdiction/states";

export type AnalysisMode = "rules_only";

export type ExtractionMethod = "embedded_text" | "pasted_text";

export type CoverageStatus = "complete" | "partial" | "unreadable";

export type DocumentExtraction = {
  method: ExtractionMethod;
  pageCount: number;
  totalChars: number;
  quality: number;
  coverageStatus: CoverageStatus;
};

export type NormalizedDocument = {
  documentId: string;
  pages: ExtractedTextPage[];
  extraction: DocumentExtraction;
};

export type AnalysisInput =
  | { kind: "text"; leaseText: string; fileName: string; stateCode: StateCode }
  | {
      kind: "pdf";
      bytes: ArrayBuffer;
      fileName: string;
      contentType: string | null;
      stateCode: StateCode;
    };

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

export type AnalysisSuccessResponse = {
  ok: true;
  analysisVersion: number;
  mode: AnalysisMode;
  stage: AnalysisStage;
  requestId: string;
  stateCode: StateCode;
  stateGuidance: StateGuidanceStatus;
  documentId: string;
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
  evidenceIndex?: EvidenceIndex;
};

export type AnalysisErrorResponse = {
  ok: false;
  requestId?: string;
  stage?: AnalysisStage;
  error:
    | string
    | {
        code: string;
        message: string;
        limit?: number;
        actual?: number;
        retryAfterSeconds?: number;
      };
};

export type AnalysisResponse = AnalysisSuccessResponse | AnalysisErrorResponse;

export type AnalysisEngineResult = {
  report: BeforeYouSignReport | null;
  reportError: string | null;
  mode: AnalysisMode;
  evidenceIndex?: EvidenceIndex;
  texasRenterFindings?: TexasRenterFinding[];
};

export type AnalysisEngine = (input: {
  document: NormalizedDocument;
  deterministic: DeterministicAnalysis;
}) => Promise<AnalysisEngineResult>;

export type PdfExtractor = (
  bytes: ArrayBuffer,
  limits?: { maxPages?: number; maxChars?: number },
) => Promise<ExtractedTextPage[]>;
