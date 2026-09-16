/**
 * OpenAI analysis model — server-side only.
 */
const DEFAULT_OPENAI_MODEL = "gpt-5.6-luna";

export function getBysOpenAiModel(): string {
  const value = process.env.BYS_OPENAI_MODEL?.trim();
  return value || DEFAULT_OPENAI_MODEL;
}
