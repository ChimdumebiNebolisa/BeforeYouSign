import { buildModelClaimPrompt } from "@/lib/analysis/model-prompt";
import type { ModelLeaseCandidate } from "@/lib/analysis/model-candidate-schema";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";

export const OPENAI_ANALYSIS_MODEL = "gpt-6-luna";

export type OpenAiFailureStage = "network" | "response" | "json_parse";

const CLAIM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", maxLength: 80 },
    kind: { type: "string", enum: ["money", "deadline", "concern"] },
    category: {
      type: "string",
      enum: [
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
      ],
    },
    label: { type: "string", maxLength: 120 },
    value: { type: "string", maxLength: 240 },
    severity: { type: "string", enum: ["minor", "moderate", "critical"] },
    explanation: { type: "string", maxLength: 360 },
    whyItMatters: { type: "string", maxLength: 280 },
    evidenceId: { type: "string", maxLength: 160 },
  },
  required: [
    "id",
    "kind",
    "category",
    "label",
    "value",
    "severity",
    "explanation",
    "whyItMatters",
    "evidenceId",
  ],
} as const;

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    claims: { type: "array", maxItems: 16, items: CLAIM_SCHEMA },
  },
  required: ["claims"],
} as const;

const DEFAULT_TIMEOUT_MS = process.env.VERCEL ? 12_000 : 20_000;
const MAX_TIMEOUT_MS = 30_000;

function analysisTimeoutMs(): number {
  const configured = Number(process.env.BYS_AI_TIMEOUT_MS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.floor(configured), MAX_TIMEOUT_MS);
}

function responseOutputText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const response = value as Record<string, unknown>;
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";

  return response.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as Record<string, unknown>).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const text = (item as Record<string, unknown>).text;
      return typeof text === "string" ? text : "";
    })
    .join("");
}

export async function runOpenAiLeaseClaims(input: {
  apiKey: string;
  evidenceCatalog: { id: string; page: number; text: string }[];
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  texasRenterFindings: TexasRenterFinding[];
  fetchImpl?: typeof fetch;
}): Promise<
  | { ok: true; rawCandidate: unknown }
  | { ok: false; failureStage: OpenAiFailureStage }
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), analysisTimeoutMs());

  try {
    const response = await (input.fetchImpl ?? fetch)("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_ANALYSIS_MODEL,
        reasoning: { effort: "none" },
        max_output_tokens: 4_096,
        store: false,
        input: buildModelClaimPrompt(input),
        text: {
          format: {
            type: "json_schema",
            name: "grounded_lease_claims",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false, failureStage: "response" };
    const data = (await response.json().catch(() => null)) as unknown;
    const outputText = responseOutputText(data);
    if (!outputText.trim()) return { ok: false, failureStage: "response" };

    try {
      return { ok: true, rawCandidate: JSON.parse(outputText) as ModelLeaseCandidate };
    } catch {
      return { ok: false, failureStage: "json_parse" };
    }
  } catch {
    return { ok: false, failureStage: "network" };
  } finally {
    clearTimeout(timeoutId);
  }
}
