import type { EvidenceRef } from "@/lib/analysis/schema";

/** Evidence is clickable only when grounded to a server-verified span in the lease text. */
export function isClickableGroundedEvidence(ev: EvidenceRef | undefined): boolean {
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
