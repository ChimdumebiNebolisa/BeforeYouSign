/**
 * Parses Gemini output that should be JSON but may include fences or extra prose.
 */

export type ParseGeminiModelJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "empty" | "invalid_json" };

/** First balanced `{ ... }` slice, respecting JSON string escaping. */
export function extractFirstJsonObject(s: string): string | null {
  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

function stripOuterCodeFences(text: string): string {
  const t = text.trim();
  const fenceBlocks = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  if (fenceBlocks.length === 0) {
    return t;
  }
  const candidates = fenceBlocks.map((m) => m[1].trim()).sort((a, b) => b.length - a.length);
  for (const c of candidates) {
    if (c.startsWith("{") || c.startsWith("[")) {
      return c;
    }
  }
  return candidates[0] ?? t;
}

function tryJsonParse(s: string): unknown | null {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}

/**
 * Sanitize then parse model output. Does not validate the BeforeYouSign report shape.
 */
export function parseGeminiModelJson(raw: string): ParseGeminiModelJsonResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const attempts: string[] = [];
  attempts.push(trimmed);
  attempts.push(stripOuterCodeFences(trimmed));

  for (const candidate of attempts) {
    const direct = tryJsonParse(candidate);
    if (direct !== null) {
      return { ok: true, value: direct };
    }
    const extracted = extractFirstJsonObject(candidate);
    if (extracted) {
      const nested = tryJsonParse(extracted);
      if (nested !== null) {
        return { ok: true, value: nested };
      }
    }
  }

  const fromRaw = extractFirstJsonObject(trimmed);
  if (fromRaw) {
    const nested = tryJsonParse(fromRaw);
    if (nested !== null) {
      return { ok: true, value: nested };
    }
  }

  return { ok: false, reason: "invalid_json" };
}
