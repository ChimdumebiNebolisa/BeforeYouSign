import type { EvidenceRef } from "@/lib/analysis/schema";

export type ClickableGroundedEvidence = EvidenceRef & {
  evidenceId: string;
  startIndex: number;
  endIndex: number;
  supportStatus: "grounded";
};

/** Evidence is clickable only when grounded to a server-verified span in the lease text. */
export function isClickableGroundedEvidence(
  ev: EvidenceRef | undefined,
): ev is ClickableGroundedEvidence {
  if (!ev) return false;
  return (
    ev.supportStatus === "grounded" &&
    typeof ev.evidenceId === "string" &&
    ev.evidenceId.length > 0 &&
    !ev.evidenceId.startsWith("legacy-") &&
    typeof ev.startIndex === "number" &&
    typeof ev.endIndex === "number" &&
    ev.endIndex > ev.startIndex
  );
}
