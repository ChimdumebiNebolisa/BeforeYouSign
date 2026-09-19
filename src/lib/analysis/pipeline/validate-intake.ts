import { randomUUID } from "node:crypto";

import { ANALYSIS_LIMITS, createAnalysisProblem, type AnalysisProblem } from "@/lib/analysis/limits";
import type { AnalysisInput } from "@/lib/analysis/pipeline/types";
import { parseStateCode, type StateCode } from "@/lib/jurisdiction/states";
import { normalizeLeasePageText } from "@/lib/pdf/normalize";

export { hashDocumentId, computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";

const inFlightByClient = new Map<string, number>();
let inFlightAnalyses = 0;

function parseRequestedState(value: unknown): StateCode | null {
  return parseStateCode(value);
}

type RequestBodyResult =
  | { ok: true; body: Uint8Array }
  | { ok: false; problem: AnalysisProblem };

async function readRequestBody(request: Request, maxBytes: number): Promise<RequestBodyResult> {
  const contentLength = request.headers.get("content-length");
  const declaredLength = contentLength ? Number(contentLength) : NaN;
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "payload_too_large",
        "Request body exceeds the analysis input limit.",
        { limit: maxBytes, actual: declaredLength },
      ),
    };
  }

  if (!request.body) {
    return { ok: true, body: new Uint8Array() };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          problem: createAnalysisProblem(
            "payload_too_large",
            "Request body exceeds the analysis input limit.",
            { limit: maxBytes, actual: total },
          ),
        };
      }
      chunks.push(value);
    }
  } catch {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Unable to read the request body."),
    };
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, body };
}

export function createRequestId(): string {
  return randomUUID();
}

export function getClientKey(request: Request): string {
  // Only trust forwarding headers when the deployment explicitly confirms that
  // its reverse proxy overwrites them. Otherwise, all anonymous traffic shares
  // the fail-closed slot instead of allowing clients to spoof arbitrary keys.
  if (process.env.BYS_TRUST_PROXY_HEADERS !== "1") return "anonymous";

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function acquireClientSlot(clientKey: string): AnalysisProblem | null {
  if (inFlightAnalyses >= ANALYSIS_LIMITS.maxConcurrentAnalyses) {
    return createAnalysisProblem(
      "rate_limited",
      "The analysis service is busy. Please wait a moment and try again.",
    );
  }

  // Anonymous requests are intentionally governed by the global cap. Sharing
  // one per-client slot would make one slow request block every visitor.
  if (clientKey !== "anonymous") {
    const current = inFlightByClient.get(clientKey) ?? 0;
    if (current >= ANALYSIS_LIMITS.maxConcurrentPerClient) {
      return createAnalysisProblem(
        "rate_limited",
        "Too many analysis requests are already in progress. Please wait and try again.",
      );
    }
    inFlightByClient.set(clientKey, current + 1);
  }
  inFlightAnalyses += 1;
  return null;
}

export function releaseClientSlot(clientKey: string): void {
  inFlightAnalyses = Math.max(0, inFlightAnalyses - 1);
  if (clientKey === "anonymous") return;

  const current = inFlightByClient.get(clientKey) ?? 0;
  if (current <= 1) inFlightByClient.delete(clientKey);
  else inFlightByClient.set(clientKey, current - 1);
}

export async function parseAnalysisInput(request: Request): Promise<
  | { ok: true; input: AnalysisInput; fileSizeBytes: number }
  | { ok: false; problem: AnalysisProblem }
> {
  const headerContentType = (request.headers.get("content-type") ?? "").toLowerCase();

  if (headerContentType.includes("application/json")) {
    const bodyResult = await readRequestBody(request, ANALYSIS_LIMITS.maxJsonRequestBytes);
    if (!bodyResult.ok) return bodyResult;

    let parsed: unknown;
    try {
      parsed = JSON.parse(new TextDecoder().decode(bodyResult.body)) as unknown;
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

    const stateCode = parseRequestedState((parsed as { stateCode?: unknown }).stateCode);
    if (!stateCode) {
      return {
        ok: false,
        problem: createAnalysisProblem(
          "invalid_input",
          "Choose the state where the rental property is located before starting analysis.",
        ),
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
      input: { kind: "text", leaseText: normalizedText, fileName, stateCode },
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

  const bodyResult = await readRequestBody(request, ANALYSIS_LIMITS.maxMultipartRequestBytes);
  if (!bodyResult.ok) return bodyResult;

  let formData: FormData;
  try {
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: new Blob([bodyResult.body.slice().buffer as ArrayBuffer]),
    });
    formData = await boundedRequest.formData();
  } catch {
    return {
      ok: false,
      problem: createAnalysisProblem("invalid_input", "Invalid multipart form body."),
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
  const stateCode = parseRequestedState(formData.get("stateCode"));
  if (!stateCode) {
    return {
      ok: false,
      problem: createAnalysisProblem(
        "invalid_input",
        "Choose the state where the rental property is located before starting analysis.",
      ),
    };
  }
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
    input: { kind: "pdf", bytes, fileName, contentType, stateCode },
    fileSizeBytes: file.size,
  };
}
