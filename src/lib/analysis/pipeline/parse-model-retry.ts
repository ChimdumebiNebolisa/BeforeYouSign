import { ANALYSIS_LIMITS, createAnalysisProblem, type AnalysisProblem } from "@/lib/analysis/limits";
import { computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";
import type { ModelRetryInput } from "@/lib/analysis/pipeline/types";
import { assessExtractionQuality, toDocumentExtraction } from "@/lib/pdf/extraction-quality";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";
import type { ExtractedTextPage } from "@/lib/pdf/extract-text";

/** Maximum JSON body size accepted by the model-retry endpoint. */
export const MAX_MODEL_RETRY_JSON_BYTES = 512 * 1024;

const UNTRUSTED_PAYLOAD_KEYS = new Set([
  "evidenceIndex",
  "evidenceIds",
  "evidenceRegistry",
  "report",
  "groundingSummary",
]);

export type ParsedModelRetryBody = {
  contentIntegrityKey: string;
  pages: ExtractedTextPage[];
  fileName: string;
  fileSizeBytes: number;
  contentType: string | null;
};

function parseRetryPages(raw: unknown): { ok: true; pages: ExtractedTextPage[] } | { ok: false; problem: AnalysisProblem } {
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Retry payload pages must be an array."),
    };
  }

  if (raw.length === 0) {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Retry payload must include at least one page."),
    };
  }

  const pages: ExtractedTextPage[] = [];
  const seenPageNumbers = new Set<number>();

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Each retry page must be an object with page and text."),
      };
    }

    const page = (item as { page?: unknown }).page;
    const text = (item as { text?: unknown }).text;

    if (typeof page !== "number" || !Number.isInteger(page) || page < 1) {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Each retry page number must be a positive integer."),
      };
    }

    if (seenPageNumbers.has(page)) {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Retry payload contains duplicate page numbers."),
      };
    }
    seenPageNumbers.add(page);

    if (typeof text !== "string") {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Each retry page must include a text string."),
      };
    }

    const normalizedText = normalizeLeasePageText(text);
    if (!normalizedText) {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Retry page text is empty after normalization."),
      };
    }

    if (normalizedText.length > ANALYSIS_LIMITS.maxChars) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          "too_many_chars",
          `A retry page exceeds the ${ANALYSIS_LIMITS.maxChars.toLocaleString()} character limit.`,
          { limit: ANALYSIS_LIMITS.maxChars, actual: normalizedText.length },
        ),
      };
    }

    pages.push({ page, text: normalizedText });
  }

  pages.sort((a, b) => a.page - b.page);
  return { ok: true, pages };
}

function rejectUntrustedFields(parsed: Record<string, unknown>): AnalysisProblem | null {
  for (const key of Object.keys(parsed)) {
    if (UNTRUSTED_PAYLOAD_KEYS.has(key)) {
      return createAnalysisProblem(
        "invalid_input",
        "Retry payload must not include server-derived evidence fields.",
      );
    }
  }
  return null;
}

export function parseModelRetryPayload(parsed: unknown): { ok: true; retry: ParsedModelRetryBody } | { ok: false; problem: AnalysisProblem } {
  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid retry payload."),
    };
  }

  const record = parsed as Record<string, unknown>;
  const untrusted = rejectUntrustedFields(record);
  if (untrusted) {
    return { ok: false, problem: untrusted };
  }

  const contentIntegrityKeyRaw = record.documentId;
  if (typeof contentIntegrityKeyRaw !== "string" || !contentIntegrityKeyRaw.trim()) {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Missing documentId (content integrity key) in retry payload."),
    };
  }

  const pagesResult = parseRetryPages(record.pages);
  if (!pagesResult.ok) {
    return pagesResult;
  }

  const pages = pagesResult.pages;

  if (pages.length > ANALYSIS_LIMITS.maxPages) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "too_many_pages",
        `Retry payload exceeds the ${ANALYSIS_LIMITS.maxPages} page limit.`,
        { limit: ANALYSIS_LIMITS.maxPages, actual: pages.length },
      ),
    };
  }

  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0);
  if (totalChars > ANALYSIS_LIMITS.maxChars) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "too_many_chars",
        `Retry payload exceeds the ${ANALYSIS_LIMITS.maxChars.toLocaleString()} character limit.`,
        { limit: ANALYSIS_LIMITS.maxChars, actual: totalChars },
      ),
    };
  }

  const expectedKey = computeContentIntegrityKey(pages);
  const submittedKey = contentIntegrityKeyRaw.trim();
  if (submittedKey !== expectedKey) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "invalid_input",
        "documentId does not match retry payload content (stale or mismatched extracted pages).",
      ),
    };
  }

  const fileNameField = record.fileName;
  const fileName =
    typeof fileNameField === "string" && fileNameField.trim().length > 0
      ? fileNameField.trim().slice(0, 255)
      : "lease-retry.txt";

  const fileSizeBytesField = record.fileSizeBytes;
  const fileSizeBytes =
    typeof fileSizeBytesField === "number" && Number.isFinite(fileSizeBytesField) && fileSizeBytesField >= 0
      ? fileSizeBytesField
      : Buffer.byteLength(pages.map((p) => p.text).join("\n"), "utf8");

  const contentTypeField = record.contentType;
  const contentType = typeof contentTypeField === "string" ? contentTypeField.slice(0, 128) : null;

  return {
    ok: true,
    retry: {
      contentIntegrityKey: submittedKey,
      pages,
      fileName,
      fileSizeBytes,
      contentType,
    },
  };
}

export function buildModelRetryInput(parsed: ParsedModelRetryBody): ModelRetryInput {
  const quality = assessExtractionQuality(parsed.pages);
  const extraction = toDocumentExtraction("pasted_text", parsed.pages, quality);

  return {
    documentId: parsed.contentIntegrityKey,
    pages: parsed.pages,
    fileName: parsed.fileName,
    fileSizeBytes: parsed.fileSizeBytes,
    contentType: parsed.contentType,
    extraction,
  };
}

export async function parseModelRetryRequest(request: Request): Promise<
  { ok: true; retry: ModelRetryInput } | { ok: false; problem: AnalysisProblem }
> {
  const headerContentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!headerContentType.includes("application/json")) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "invalid_input",
        "Model retry requires application/json body.",
      ),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number.parseInt(contentLength, 10);
    if (Number.isFinite(length) && length > MAX_MODEL_RETRY_JSON_BYTES) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          "payload_too_large",
          "Retry request body is too large.",
          { limit: MAX_MODEL_RETRY_JSON_BYTES, actual: length },
        ),
      };
    }
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Unable to read retry request body."),
    };
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_MODEL_RETRY_JSON_BYTES) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "payload_too_large",
        "Retry request body is too large.",
        { limit: MAX_MODEL_RETRY_JSON_BYTES, actual: Buffer.byteLength(rawBody, "utf8") },
      ),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid JSON body."),
    };
  }

  const result = parseModelRetryPayload(parsed);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    retry: buildModelRetryInput(result.retry),
  };
}
