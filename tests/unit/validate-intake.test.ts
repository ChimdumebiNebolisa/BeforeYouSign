import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";
import {
  acquireClientSlot,
  getClientKey,
  parseAnalysisInput,
  releaseClientSlot,
  resetRateLimitStateForTests,
} from "@/lib/analysis/pipeline/validate-intake";

function jsonRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function chunkedJsonRequest(chunk: Uint8Array): Request {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function chunkedMultipartRequest(chunk: Uint8Array): Request {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "multipart/form-data; boundary=ignored" },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("analysis intake limits and client throttling", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.stubEnv("BYS_TRUST_PROXY", "0");
  });

  afterEach(() => {
    resetRateLimitStateForTests();
    vi.unstubAllEnvs();
  });

  it("rejects an oversized JSON body from Content-Length before parsing", async () => {
    const parsed = await parseAnalysisInput(
      jsonRequest('{"leaseText":"short"}', {
        "content-length": String(ANALYSIS_LIMITS.maxJsonBodyBytes + 1),
      }),
    );

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.problem.code).toBe("payload_too_large");
      expect(parsed.problem.httpStatus).toBe(413);
    }
  });

  it("rejects a chunked JSON body as soon as it crosses the byte limit", async () => {
    const parsed = await parseAnalysisInput(
      chunkedJsonRequest(new Uint8Array(ANALYSIS_LIMITS.maxJsonBodyBytes + 1)),
    );

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.problem.code).toBe("payload_too_large");
  });

  it("rejects an oversized chunked multipart body before form parsing", async () => {
    const parsed = await parseAnalysisInput(
      chunkedMultipartRequest(
        new Uint8Array(ANALYSIS_LIMITS.maxPdfBytes + ANALYSIS_LIMITS.maxMultipartOverheadBytes + 1),
      ),
    );

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.problem.code).toBe("payload_too_large");
      expect(parsed.problem.httpStatus).toBe(413);
    }
  });

  it("accepts a valid multipart PDF within the bounded parser", async () => {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], { type: "application/pdf" }),
      "lease.pdf",
    );
    const parsed = await parseAnalysisInput(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: form,
      }),
    );

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.kind).toBe("pdf");
      expect(parsed.input.fileName).toBe("lease.pdf");
    }
  });

  it("does not trust forwarding headers unless a trusted proxy is configured", () => {
    const request = jsonRequest("{}", {
      "x-forwarded-for": "203.0.113.50",
      "x-real-ip": "198.51.100.10",
    });

    expect(getClientKey(request)).toBe("unidentified-client");

    vi.stubEnv("BYS_TRUST_PROXY", "1");
    expect(getClientKey(request)).toBe("198.51.100.10");
  });

  it("enforces both concurrent and windowed request limits", () => {
    const client = "client-a";
    expect(acquireClientSlot(client, 0)).toBeNull();
    expect(acquireClientSlot(client, 0)?.code).toBe("rate_limited");
    releaseClientSlot(client);

    for (let i = 1; i < ANALYSIS_LIMITS.maxRequestsPerRateWindow; i += 1) {
      expect(acquireClientSlot(client, 0)).toBeNull();
      releaseClientSlot(client);
    }
    expect(acquireClientSlot(client, 0)?.code).toBe("rate_limited");

    expect(acquireClientSlot(client, ANALYSIS_LIMITS.rateWindowMs)).toBeNull();
    releaseClientSlot(client);
  });
});
