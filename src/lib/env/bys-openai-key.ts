/**
 * OpenAI API key — server-side only.
 */
export function getBysOpenAiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}
