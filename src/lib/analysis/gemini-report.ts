import { GoogleGenerativeAI, type EnhancedGenerateContentResponse } from "@google/generative-ai";

import { USER_SAFE_AI_REPORT_UNAVAILABLE } from "@/lib/analysis/ai-user-messages";
import { LEASE_REPORT_RESPONSE_SCHEMA } from "@/lib/analysis/gemini-response-schema";
import { buildLeaseAnalysisUserPrompt } from "@/lib/analysis/prompt";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import {
  type BeforeYouSignReport,
  parseBeforeYouSignReportJson,
  tryParseModelJson,
} from "@/lib/analysis/schema";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { getBysGeminiModel } from "@/lib/env/bys-gemini-model";

const isDev = process.env.NODE_ENV === "development";

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
}): Promise<
  | { ok: true; rawText: string; report: BeforeYouSignReport }
  | {
      ok: false;
      userMessage: string;
      rawText?: string;
      failureStage: StructuredLeaseFailureStage;
    }
> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const modelName = getBysGeminiModel();

  const prompt = buildLeaseAnalysisUserPrompt({
    leaseText: input.leaseText,
    ruleBasedFindings: input.ruleBasedFindings,
    deterministicRisk: input.deterministicRisk,
  });

  /** Long leases need a high ceiling; truncated JSON fails parsing. Gemini 2.5 Flash supports large outputs. */
  const baseConfig = {
    temperature: 0.2,
    maxOutputTokens: 65_536,
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
    const result = await modelWithSchema.generateContent(prompt);
    rawText = collectModelText(result.response);
  } catch (e) {
    if (shouldRetryGenerationWithoutSchema(e)) {
      const modelPlain = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: jsonOnlySystem,
        generationConfig: baseConfig,
      });
      try {
        const result = await modelPlain.generateContent(prompt);
        rawText = collectModelText(result.response);
      } catch (e2) {
        const message = e2 instanceof Error ? e2.message : "Gemini request failed.";
        if (isDev) {
          console.error("[beforeyousign][gemini] request failed (fallback)", message);
        }
        return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };
      }
    } else {
      const message = e instanceof Error ? e.message : "Gemini request failed.";
      if (isDev) {
        console.error("[beforeyousign][gemini] request failed", message);
      }
      return { ok: false, userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE, failureStage: "network" };
    }
  }

  if (isDev) {
    console.log("[beforeyousign][gemini] raw model response\n", rawText);
  }

  if (!rawText.trim()) {
    return {
      ok: false,
      userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE,
      rawText,
      failureStage: "json_parse",
    };
  }

  const parsed = tryParseModelJson(rawText);
  if (parsed === null) {
    return {
      ok: false,
      userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE,
      rawText,
      failureStage: "json_parse",
    };
  }

  const report = parseBeforeYouSignReportJson(parsed);
  if (!report) {
    return {
      ok: false,
      userMessage: USER_SAFE_AI_REPORT_UNAVAILABLE,
      rawText,
      failureStage: "schema_validation",
    };
  }

  return { ok: true, rawText, report };
}
