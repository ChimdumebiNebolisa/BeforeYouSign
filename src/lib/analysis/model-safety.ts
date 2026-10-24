const BANNED_WORDS = [
  /\billegal\b/i,
  /\bvalid\b/i,
  /\benforceable\b/i,
  /\bunenforceable\b/i,
  /\bunsafe\b/i,
  /\bshould sign\b/i,
  /\bshould not sign\b/i,
  /\b(?:texas|state|federal|local)\s+(?:law|code|statute|rules?)\b/i,
  /\b(?:law|statute|code)\s+(?:requires?|allows?|prohibits?|says)\b/i,
  /\b(?:violates?|complies? with)\s+(?:the\s+)?(?:law|code|statute)\b/i,
];

export function containsBannedWording(text: string): boolean {
  const normalized = text.replace(/\binvalid\w*/gi, "");
  return BANNED_WORDS.some((pattern) => pattern.test(normalized));
}
