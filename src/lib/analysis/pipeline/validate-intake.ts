import { randomUUID } from "node:crypto";

import { ANALYSIS_LIMITS, createAnalysisProblem, type AnalysisProblem } from "@/lib/analysis/limits";
import type { AnalysisInput } from "@/lib/analysis/pipeline/types";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

export { hashDocumentId, computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";

type ClientRateState = {
  windowStartedAt: number;
  requestCount: number;
  inFlight: number;
  lastSeenAt: number;
};

const clientRateState = new Map<string, ClientRateState>();

export class RequestBodyTooLargeError extends Error {
  readonly actual: number;
  readonly limit: number;

  constructor(actual: number, limit: number) {
    super("Request body exceeds the configured limit.");
    this.name = "RequestBodyTooLargeError";
    this.actual = actual;
    this.limit = limit;
  }
}

export function isRequestBodyTooLargeError(error: unknown): error is RequestBodyTooLargeError {
  return (
    error instanceof RequestBodyTooLargeError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "RequestBodyTooLargeError")
  );
}

function getContentLength(request: Request): number | null {
  const raw = request.headers.get("content-length");
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function assertContentLength(request: Request, limit: number): void {
  const contentLength = getContentLength(request);
  if (contentLength !== null && contentLength > limit) {
    throw new RequestBodyTooLargeError(contentLength, limit);
  }
}

export async function readRequestTextWithinLimit(request: Request, limit: number): Promise<string> {
  assertContentLength(request, limit);

  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = value ?? new Uint8Array();
      total += chunk.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new RequestBodyTooLargeError(total, limit);
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export function createLimitedRequest(request: Request, limit: number): Request {
  assertContentLength(request, limit);
  if (!request.body) return request;

  const source = request.body;
  let total = 0;
  const limitedBody = new ReadableStream<Uint8Array>({
    start(controller) {
      const reader = source.getReader();
      const pump = (): Promise<void> =>
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }

          const chunk = value ?? new Uint8Array();
          total += chunk.byteLength;
          if (total > limit) {
            void reader.cancel();
            controller.error(new RequestBodyTooLargeError(total, limit));
            return;
          }

          controller.enqueue(chunk);
          return pump();
        }).catch((error: unknown) => controller.error(error));

      return pump();
    },
  });

  return new Request(request, { body: limitedBody, duplex: "half" } as RequestInit & { duplex: "half" });
}

function pruneRateLimitState(now: number): void {
  for (const [key, state] of clientRateState) {
    if (now - state.lastSeenAt > ANALYSIS_LIMITS.rateWindowMs) {
      clientRateState.delete(key);
    }
  }

  while (clientRateState.size >= ANALYSIS_LIMITS.maxRateLimitEntries) {
    let oldestKey: string | null = null;
    let oldestSeenAt = Number.POSITIVE_INFINITY;
    for (const [key, state] of clientRateState) {
      if (state.lastSeenAt < oldestSeenAt) {
        oldestKey = key;
        oldestSeenAt = state.lastSeenAt;
      }
    }
    if (!oldestKey) break;
    clientRateState.delete(oldestKey);
  }
}

export function resetRateLimitStateForTests(): void {
  clientRateState.clear();
}

export function createRequestId(): string {
  return randomUUID();
}

export function getClientKey(request: Request): string {
  if (process.env.BYS_TRUST_PROXY !== "1") return "unidentified-client";

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unidentified-client";
  return "unidentified-client";
}

export function acquireClientSlot(clientKey: string, now = Date.now()): AnalysisProblem | null {
  pruneRateLimitState(now);
  let state = clientRateState.get(clientKey);
  if (!state || now - state.windowStartedAt >= ANALYSIS_LIMITS.rateWindowMs) {
    state = {
      windowStartedAt: now,
      requestCount: 0,
      inFlight: 0,
      lastSeenAt: now,
    };
    clientRateState.set(clientKey, state);
  }

  state.lastSeenAt = now;
  if (state.requestCount >= ANALYSIS_LIMITS.maxRequestsPerRateWindow) {
    return createAnalysisProblem(
      "rate_limited",
      "Too many analysis requests were made recently. Please wait and try again.",
    );
  }

  if (state.inFlight >= ANALYSIS_LIMITS.maxConcurrentPerClient) {
    return createAnalysisProblem(
      "rate_limited",
      "Too many analysis requests are already in progress. Please wait and try again.",
    );
  }

  state.requestCount += 1;
  state.inFlight += 1;
  return null;
}

export function releaseClientSlot(clientKey: string): void {
  const state = clientRateState.get(clientKey);
  if (!state) return;
  state.inFlight = Math.max(0, state.inFlight - 1);
  state.lastSeenAt = Date.now();
}

export async function parseAnalysisInput(request: Request): Promise<
  | { ok: true; input: AnalysisInput; fileSizeBytes: number }
  | { ok: false; problem: AnalysisProblem }
> {
  const headerContentType = (request.headers.get("content-type") ?? "").toLowerCase();

  if (headerContentType.includes("application/json")) {
    let parsed: unknown;
    try {
      const rawBody = await readRequestTextWithinLimit(request, ANALYSIS_LIMITS.maxJsonBodyBytes);
      parsed = JSON.parse(rawBody);
    } catch (error) {
      if (isRequestBodyTooLargeError(error)) {
        return {
          ok: false,
          problem: createAnalysisProblem(
            "payload_too_large",
            "JSON request body is too large.",
            { limit: error.limit, actual: error.actual },
          ),
        };
      }
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

  let formData: FormData;
  try {
    formData = await createLimitedRequest(
      request,
      ANALYSIS_LIMITS.maxPdfBytes + ANALYSIS_LIMITS.maxMultipartOverheadBytes,
    ).formData();
  } catch (error) {
    if (isRequestBodyTooLargeError(error)) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          "payload_too_large",
          "Multipart request body is too large.",
          { limit: error.limit, actual: error.actual },
        ),
      };
    }
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid multipart request body."),
    };
  }
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
