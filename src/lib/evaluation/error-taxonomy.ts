export const ERROR_TAXONOMY = {
  extraction_loss: "Text lost during PDF extraction",
  extraction_order: "Page order incorrect after extraction",
  extraction_table: "Table structure lost in extraction",
  detector_false_positive: "Rule/detector matched unrelated text",
  detector_false_negative: "Expected clause not detected",
  wrong_field_association: "Correct span linked to wrong field",
  wrong_evidence_span: "Evidence span does not support claim",
  unsupported_synthesis: "Model invented unsupported content",
  duplicate_conflict: "Duplicate or conflicting claims emitted",
  false_omission: "Present clause reported as missing",
  source_provenance: "Legal/context source metadata error",
  provider_timeout: "Model provider timed out",
  provider_failure: "Model provider request failed",
  schema_failure: "Model output failed schema validation",
} as const;

export type ErrorTaxonomyCode = keyof typeof ERROR_TAXONOMY;
