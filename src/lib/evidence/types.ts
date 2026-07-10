import type { EvidenceRef } from "@/lib/analysis/schema";

export type SupportStatus = "grounded" | "unknown" | "unsupported";

export type EvidenceChunk = {
  id: string;
  page: number;
  startIndex: number;
  endIndex: number;
  text: string;
  ordinal: number;
};

export type GroundedEvidenceRef = EvidenceRef & {
  evidenceId: string;
  supportStatus: SupportStatus;
};

export type EvidenceRegistry = {
  chunks: EvidenceChunk[];
  byId: Map<string, EvidenceChunk>;
};
