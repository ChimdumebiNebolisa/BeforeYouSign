import { SchemaType, type ObjectSchema } from "@google/generative-ai";

const FINDING_CATEGORY_ENUM = [
  "fees",
  "renewal",
  "notice",
  "maintenance",
  "utilities",
  "guests",
  "pets",
  "subletting",
  "termination",
  "entry",
  "other",
] as const;

const SEVERITY_ENUM = ["minor", "moderate", "critical"] as const;

const RISK_LEVEL_ENUM = ["low", "medium", "high"] as const;

const evidenceRefSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    page: { type: SchemaType.INTEGER },
    quote: { type: SchemaType.STRING },
    startIndex: { type: SchemaType.INTEGER, nullable: true },
    endIndex: { type: SchemaType.INTEGER, nullable: true },
  },
  required: ["page", "quote"],
};

const labeledRowSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    label: { type: SchemaType.STRING },
    value: { type: SchemaType.STRING },
    evidence: {
      type: SchemaType.ARRAY,
      items: evidenceRefSchema,
    },
  },
  required: ["label", "value"],
};

const findingSchema: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    id: { type: SchemaType.STRING },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...FINDING_CATEGORY_ENUM],
    },
    title: { type: SchemaType.STRING },
    severity: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...SEVERITY_ENUM],
    },
    explanation: { type: SchemaType.STRING },
    whyItMatters: { type: SchemaType.STRING },
    evidence: {
      type: SchemaType.ARRAY,
      items: evidenceRefSchema,
      minItems: 1,
    },
  },
  required: ["id", "category", "title", "severity", "explanation", "whyItMatters", "evidence"],
};

/**
 * Gemini JSON response schema aligned with {@link BeforeYouSignReport} in schema.ts.
 */
export const LEASE_REPORT_RESPONSE_SCHEMA: ObjectSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    whatYoureAgreeingTo: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    riskLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [...RISK_LEVEL_ENUM],
    },
    riskReason: { type: SchemaType.STRING },
    moneyAndFees: {
      type: SchemaType.ARRAY,
      items: labeledRowSchema,
    },
    deadlinesAndNotice: {
      type: SchemaType.ARRAY,
      items: labeledRowSchema,
    },
    responsibilities: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    potentialRedFlags: {
      type: SchemaType.ARRAY,
      items: findingSchema,
    },
    questionsToAsk: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    nextSteps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    missingOrUnclear: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    disclaimer: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "whatYoureAgreeingTo",
    "riskLevel",
    "riskReason",
    "moneyAndFees",
    "deadlinesAndNotice",
    "responsibilities",
    "potentialRedFlags",
    "questionsToAsk",
    "nextSteps",
    "missingOrUnclear",
    "disclaimer",
  ],
};
