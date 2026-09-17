import { GoogleGenerativeAI, type EnhancedGenerateContentResponse } from "@google/generative-ai";

import { USER_SAFE_AI_REPORT_UNAVAILABLE } from "@/lib/analysis/ai-user-messages";
import { LEASE_REPORT_RESPONSE_SCHEMA } from "@/lib/analysis/gemini-response-schema";
import { buildLeaseAnalysisUserPrompt } from "@/lib/analysis/prompt";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import type { TexasRenterFinding } from "@/lib/legal-reference/texas-renter-scan";
import { tryParseModelJson } from "@/lib/analysis/schema";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { getBysGeminiModel } from "@/lib/env/bys-gemini-model";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

const DEFAULT_AI_TIMEOUT_MS = process.env.VERCEL ? 8_500 : 20_000;

function getAiTimeoutMs(): number {
  const raw = process.env.BYS_AI_TIMEOUT_MS;
  if (!raw) return DEFAULT_AI_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_AI_TIMEOUT_MS;
  }
  return Math.floor(parsed);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (timeoutMs <= 0) {
    return promise;
  }

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Gemini request timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function collectModelText(response: EnhancedGenerateContentResponse): string {
  try {
    return response.text();
  } catch {
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts?.length) {
      return "";
    }
    return parts
      .map((p) => (typeof p === "object" && p && "text" in p && typeof p.text === "string" ? p.text : ""))
      .join("");
  }
}

function shouldRetryGenerationWithoutSchema(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /responseSchema|response_schema|invalid json|Invalid JSON|schema/i.test(msg) ||
    (msg.includes("400") && /generat|payload|field/i.test(msg))
  );
}

export type StructuredLeaseFailureStage = "network" | "json_parse" | "schema_validation";

export async function runStructuredLeaseAnalysis(input: {
  apiKey: string;
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
  texasRenterFindings?: TexasRenterFinding[];
  evidenceCatalog?: { id: string; page: number; text: string }[];
}): Promise<
  | { ok: true; rawText: string; rawParsed: unknown }
  | {
      ok: false;
      userMessage: string;
      failureStage: StructuredLeaseFailureStage;
    }
> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const modelName = getBysGeminiModel();
  const aiTimeoutMs = getAiTimeoutMs();

  const prompt = buildLeaseAnalysisUserPrompt({
    leaseText: input.leaseText,
    ruleBasedFindings: input.ruleBasedFindings,
    deterministicRisk: input.deterministicRisk,
    texasRenterFindings: input.texasRenterFindings,
    evidenceCatalog: input.evidenceCatalog,
    maxLeaseChars: ANALYSIS_LIMITS.maxChars,
  });

  const baseConfig = {
    temperature: 0.2,
    maxOutputTokens: 8_192,
    responseMimeType: "application/json" as const,
  };

  const jsonOnlySystem =
    "You output JSON only. No markdown, no code fences, no commentary, no text before or after the JSON object.";

  const modelWithSchema = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: jsonOnlySystem,
    generationConfig: {
      ...baseConfig,
      responseSchema: LEASE_REPORT_RESPONSE_SCHEMA,
    },
  });

  let rawText = "";
  try {
    const result = await withTimeout(modelWithSchema.generateContent(prompt), aiTimeoutMs);
    rawText = collectModelText(result.response);
  } catch (e) {
    if (shouldRetryGenerationWithoutSchema(e)) {
      const modelPlain = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: jsonOnlySystem,
        generationConfig: baseConfig,
      });
      try {
        const result = await withTimeout(modelPlain.generateContent(prompt), aiTimeoutMs);
        rawText = collectModelText(result.response);
      } catch {
        return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };
      }
    } else {
      return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };
    }
  }

  if (!rawText.trim()) {
    return {
      ok: false,
      userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE,
      failureStage: "json_parse",
    };
  }

  const parsed = tryParseModelJson(rawText);
  if (parsed === null) {
    return {
      ok: false,
      userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE,
      failureStage: "json_parse",
    };
  }

  return {
    ok: true,
    rawText,
    rawParsed: parsed,
  };
}
