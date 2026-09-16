import { tryParseModelJson } from "@/lib/analysis/schema";
import { USER_SAFE_AI_REPORT_UNAVAILABLE } from "@/lib/analysis/ai-user-messages";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";
import { buildLeaseAnalysisUserPrompt } from "@/lib/analysis/prompt";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { getBysOpenAiModel } from "@/lib/env/bys-openai-model";

export type OpenAiStructuredFailureStage = "network" | "json_parse" | "schema_validation";

const LABELED_ROW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    label: { type: "string" },
    value: { type: "string" },
    evidenceIds: { type: "array", items: { type: "string" } },
  },
  required: ["label", "value", "evidenceIds"],
} as const;

const FINDING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    category: { type: "string", enum: ["fees", "renewal", "notice", "maintenance", "utilities", "guests", "pets", "subletting", "termination", "entry", "other"] },
    title: { type: "string" },
    severity: { type: "string", enum: ["minor", "moderate", "critical"] },
    explanation: { type: "string" },
    whyItMatters: { type: "string" },
    evidenceIds: { type: "array", items: { type: "string" } },
  },
  required: ["id", "category", "title", "severity", "explanation", "whyItMatters", "evidenceIds"],
} as const;

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    whatYoureAgreeingTo: { type: "array", items: { type: "string" } },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    riskReason: { type: "string" },
    moneyAndFees: { type: "array", items: LABELED_ROW_SCHEMA },
    deadlinesAndNotice: { type: "array", items: LABELED_ROW_SCHEMA },
    responsibilities: { type: "array", items: { type: "string" } },
    potentialRedFlags: { type: "array", items: FINDING_SCHEMA },
    questionsToAsk: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } },
    missingOrUnclear: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
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
} as const;

const DEFAULT_AI_TIMEOUT_MS = process.env.VERCEL ? 8_500 : 20_000;

function getAiTimeoutMs(): number {
  const raw = process.env.BYS_AI_TIMEOUT_MS;
  if (!raw) return DEFAULT_AI_TIMEOUT_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_AI_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) return promise;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("OpenAI request timed out.")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function outputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const root = data as Record<string, unknown>;
  if (typeof root.output_text === "string") return root.output_text;
  if (!Array.isArray(root.output)) return "";
  return root.output
    .flatMap((item) => (item && typeof item === "object" && Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : []))
    .map((item) => (item && typeof item === "object" && typeof (item as Record<string, unknown>).text === "string" ? (item as Record<string, unknown>).text : ""))
    .join("");
}

export async function runStructuredOpenAiLeaseAnalysis(input: {
  apiKey: string;
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  texasRenterFindings?: TexasRenterFinding[];
  evidenceCatalog?: { id: string; page: number; text: string }[];
}): Promise<
  | { ok: true; rawText: string; rawParsed: unknown }
  | { ok: false; userMessage: string; failureStage: OpenAiStructuredFailureStage }
> {
  const prompt = buildLeaseAnalysisUserPrompt({
    leaseText: input.leaseText,
    ruleBasedFindings: input.ruleBasedFindings,
    deterministicRisk: input.deterministicRisk,
    texasRenterFindings: input.texasRenterFindings,
    evidenceCatalog: input.evidenceCatalog,
    maxLeaseChars: ANALYSIS_LIMITS.maxChars,
  });

  try {
    const response = await withTimeout(fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getBysOpenAiModel(),
        input: prompt,
        max_output_tokens: 8_192,
        store: false,
        text: {
          format: {
            type: "json_schema",
            name: "lease_report",
            strict: true,
            schema: REPORT_SCHEMA,
          },
        },
      }),
      cache: "no-store",
    }), getAiTimeoutMs());

    const data = await response.json().catch(() => null);
    if (!response.ok) return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };

    const rawText = outputText(data);
    if (!rawText.trim()) return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "json_parse" };
    const parsed = tryParseModelJson(rawText);
    if (parsed === null) return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "json_parse" };
    return { ok: true, rawText, rawParsed: parsed };
  } catch {
    return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };
  }
}
