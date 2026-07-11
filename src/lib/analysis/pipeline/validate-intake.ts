import { createHash, randomUUID } from "node:crypto";

import { ANALYSIS_LIMITS, createAnalysisProblem, type AnalysisProblem } from "@/lib/analysis/limits";
import type { AnalysisInput } from "@/lib/analysis/pipeline/types";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

const inFlightByClient = new Map<string, number>();

export function createRequestId(): string {
  return randomUUID();
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function acquireClientSlot(clientKey: string): AnalysisProblem | null {
  const current = inFlightByClient.get(clientKey) ?? 0;
  if (current >= ANALYSIS_LIMITS.maxConcurrentPerClient) {
    return createAnalysisProblem(
      "rate_limited",
      "Too many analysis requests are already in progress. Please wait and try again.",
    );
  }
  inFlightByClient.set(clientKey, current + 1);
  return null;
}

export function releaseClientSlot(clientKey: string): void {
  const current = inFlightByClient.get(clientKey) ?? 0;
  if (current <= 1) inFlightByClient.delete(clientKey);
  else inFlightByClient.set(clientKey, current - 1);
}

export function hashDocumentId(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export async function parseAnalysisInput(request: Request): Promise<
  | { ok: true; input: AnalysisInput; fileSizeBytes: number }
  | { ok: false; problem: AnalysisProblem }
> {
  const headerContentType = (request.headers.get("content-type") ?? "").toLowerCase();

  if (headerContentType.includes("application/json")) {
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Invalid JSON body."),
      };
    }

    if (!parsed || typeof parsed !== "object" || !("leaseText" in parsed)) {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "Missing leaseText in JSON body."),
      };
    }

    const rawText = (parsed as { leaseText: unknown }).leaseText;
    if (typeof rawText !== "string") {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "leaseText must be a string."),
      };
    }

    const normalizedText = normalizeLeasePageText(rawText);
    if (!normalizedText) {
      return {
        ok: false,
        problem: createAnalysisProblem("invalid_input", "leaseText is empty after normalization."),
      };
    }

    if (normalizedText.length > ANALYSIS_LIMITS.maxChars) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          "too_many_chars",
          `Pasted text exceeds the ${ANALYSIS_LIMITS.maxChars.toLocaleString()} character limit.`,
          { limit: ANALYSIS_LIMITS.maxChars, actual: normalizedText.length },
        ),
      };
    }

    const fileNameField = (parsed as { fileName?: unknown }).fileName;
    const fileName =
      typeof fileNameField === "string" && fileNameField.trim().length > 0
        ? fileNameField.trim()
        : "pasted-lease.txt";

    return {
      ok: true,
      input: { kind: "text", leaseText: normalizedText, fileName },
      fileSizeBytes: Buffer.byteLength(normalizedText, "utf8"),
    };
  }

  if (!headerContentType.includes("multipart/form-data")) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "unsupported_media_type",
        "Unsupported content type. Use application/json for pasted text or multipart/form-data for PDF upload.",
      ),
    };
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "invalid_input",
        "Missing file. Expected multipart form field 'file'.",
      ),
    };
  }

  if (file.size > ANALYSIS_LIMITS.maxPdfBytes) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "payload_too_large",
        `PDF exceeds the ${Math.round(ANALYSIS_LIMITS.maxPdfBytes / (1024 * 1024))} MB upload limit.`,
        { limit: ANALYSIS_LIMITS.maxPdfBytes, actual: file.size },
      ),
    };
  }

  const fileName = (file as unknown as { name?: string }).name ?? "uploaded.pdf";
  const contentType = file.type || null;
  const bytes = await file.arrayBuffer();

  const pdfHeader = new Uint8Array(bytes.slice(0, 5));
  const isPdf =
    pdfHeader[0] === 0x25 &&
    pdfHeader[1] === 0x50 &&
    pdfHeader[2] === 0x44 &&
    pdfHeader[3] === 0x46 &&
    pdfHeader[4] === 0x2d;

  if (!isPdf) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "unsupported_media_type",
        "Uploaded file is not a valid PDF.",
      ),
    };
  }

  return {
    ok: true,
    input: { kind: "pdf", bytes, fileName, contentType },
    fileSizeBytes: file.size,
  };
}

function parseRetryPages(raw: unknown): { page: number; text: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const pages: { page: number; text: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const page = (item as { page?: unknown }).page;
    const text = (item as { text?: unknown }).text;
    if (typeof page !== "number" || !Number.isFinite(page) || page < 1) return null;
    if (typeof text !== "string") return null;
    pages.push({ page, text: normalizeLeasePageText(text) });
  }
  return pages.length > 0 ? pages : null;
}

export async function parseModelRetryInput(request: Request): Promise<
  | { ok: true; retry: import("@/lib/analysis/pipeline/types").ModelRetryInput }
  | { ok: false; problem: AnalysisProblem }
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

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid JSON body."),
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid retry payload."),
    };
  }

  const documentId = (parsed as { documentId?: unknown }).documentId;
  const pages = parseRetryPages((parsed as { pages?: unknown }).pages);
  const fileNameField = (parsed as { fileName?: unknown }).fileName;
  const fileSizeBytesField = (parsed as { fileSizeBytes?: unknown }).fileSizeBytes;
  const contentTypeField = (parsed as { contentType?: unknown }).contentType;
  const extractionField = (parsed as { extraction?: unknown }).extraction;

  if (typeof documentId !== "string" || !documentId.trim()) {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Missing documentId in retry payload."),
    };
  }

  if (!pages) {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid pages in retry payload."),
    };
  }

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
  if (totalChars === 0) {
    return {
      ok: false,
      problem: createAnalysisProblem("extraction_empty", "Retry payload has no extractable text."),
    };
  }

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

  const expectedDocumentId = hashDocumentId(pages.map((p) => p.text).join("\n"));
  if (documentId.trim() !== expectedDocumentId) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "invalid_input",
        "documentId does not match retry payload content.",
      ),
    };
  }

  const fileName =
    typeof fileNameField === "string" && fileNameField.trim().length > 0
      ? fileNameField.trim()
      : "lease-retry.txt";

  const fileSizeBytes =
    typeof fileSizeBytesField === "number" && Number.isFinite(fileSizeBytesField)
      ? fileSizeBytesField
      : Buffer.byteLength(pages.map((p) => p.text).join("\n"), "utf8");

  const contentType = typeof contentTypeField === "string" ? contentTypeField : null;

  let extraction: import("@/lib/analysis/pipeline/types").DocumentExtraction;
  if (
    extractionField &&
    typeof extractionField === "object" &&
    "method" in extractionField &&
    "pageCount" in extractionField &&
    "totalChars" in extractionField &&
    "quality" in extractionField &&
    "coverageStatus" in extractionField
  ) {
    const ext = extractionField as import("@/lib/analysis/pipeline/types").DocumentExtraction;
    extraction = ext;
  } else {
    extraction = {
      method: "pasted_text",
      pageCount: pages.length,
      totalChars,
      quality: 1,
      coverageStatus: "complete",
    };
  }

  return {
    ok: true,
    retry: {
      documentId: documentId.trim(),
      pages,
      fileName,
      fileSizeBytes,
      contentType,
      extraction,
    },
  };
}
