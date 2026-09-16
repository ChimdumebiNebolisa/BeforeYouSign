export const DEFAULT_PRACTICE_MODEL = "gpt-realtime-2.1-mini";
export const DEFAULT_REVIEW_MODEL = "gpt-5.6-luna";

function enabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function practiceAccess(operatorToken: string | undefined) {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const configuredOperator = process.env.BYS_OPERATOR_TOKEN?.trim() ?? "";
  const model = process.env.BYS_PRACTICE_MODEL?.trim() || DEFAULT_PRACTICE_MODEL;
  const maxSeconds = Number(process.env.BYS_PRACTICE_MAX_SECONDS || "180");
  const validModel = model === DEFAULT_PRACTICE_MODEL || model.startsWith("gpt-realtime");
  const enabledFlag = enabled(process.env.BYS_PRACTICE_ENABLED);

  return {
    allowed: enabledFlag && Boolean(apiKey) && Boolean(configuredOperator) && operatorToken === configuredOperator && validModel && maxSeconds >= 30 && maxSeconds <= 600,
    reason: !enabledFlag ? "Practice is disabled." : !apiKey ? "Practice credentials are missing." : !configuredOperator ? "Operator access is not configured." : operatorToken !== configuredOperator ? "Operator authorization was not accepted." : !validModel ? "The configured practice model is not supported." : "The practice time limit is invalid.",
    apiKey,
    model,
    maxSeconds,
  };
}
