/**
 * AI provider key — server-side only.
 * Do not import this module from client components or expose the value to the browser.
 */
export function getBysAiKey(): string | undefined {
  return process.env.BYS_AI_KEY;
}
