import { GoogleGenerativeAI } from "@google/generative-ai";

import { buildLeaseAnalysisUserPrompt } from "@/lib/analysis/prompt";
import type { RuleBasedFinding } from "@/lib/analysis/rules";
import {
  type BeforeYouSignReport,
  parseBeforeYouSignReportJson,
  tryParseModelJson,
} from "@/lib/analysis/schema";
import type { DeterministicLeaseRisk } from "@/lib/analysis/scoring";
import { getBysGeminiModel } from "@/lib/env/bys-gemini-model";

export async function runStructuredLeaseAnalysis(input: {
  apiKey: string;
  leaseText: string;
  ruleBasedFindings: RuleBasedFinding[];
  deterministicRisk: DeterministicLeaseRisk;
}): Promise<
  { ok: true; rawText: string; report: BeforeYouSignReport } | { ok: false; error: string; rawText?: string }
> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const model = genAI.getGenerativeModel({
    model: getBysGeminiModel(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 8192,
    },
  });

  const prompt = buildLeaseAnalysisUserPrompt({
    leaseText: input.leaseText,
    ruleBasedFindings: input.ruleBasedFindings,
    deterministicRisk: input.deterministicRisk,
  });

  let rawText: string;
  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Gemini request failed.";
    return { ok: false, error: message };
  }

  const parsed = tryParseModelJson(rawText);
  if (parsed === null) {
    return {
      ok: false,
      error: "Model output was not valid JSON.",
      rawText: rawText.slice(0, 2000),
    };
  }

  const report = parseBeforeYouSignReportJson(parsed);
  if (!report) {
    return {
      ok: false,
      error: "Model JSON did not match the expected BeforeYouSign report shape.",
      rawText: rawText.slice(0, 2000),
    };
  }

  return { ok: true, rawText, report };
}
