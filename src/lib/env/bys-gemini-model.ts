/**
 * Gemini model id — server-side only.
 * Do not import this module from client components or expose the value to the browser.
 */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function getBysGeminiModel(): string {
  const v = process.env.BYS_GEMINI_MODEL?.trim();
  return v && v.length > 0 ? v : DEFAULT_GEMINI_MODEL;
}
