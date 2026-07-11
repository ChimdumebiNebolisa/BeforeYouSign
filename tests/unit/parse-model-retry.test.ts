import { describe, expect, it } from "vitest";

import {
  MAX_MODEL_RETRY_JSON_BYTES,
  parseModelRetryPayload,
  buildModelRetryInput,
  parseModelRetryRequest,
} from "@/lib/analysis/pipeline/parse-model-retry";
import { computeContentIntegrityKey } from "@/lib/analysis/pipeline/content-integrity";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";

function validPayload(pages: { page: number; text: string }[]) {
  const key = computeContentIntegrityKey(pages);
  return {
    documentId: key,
    pages,
    fileName: "lease.txt",
    fileSizeBytes: pages.reduce((n, p) => n + p.text.length, 0),
    contentType: "text/plain",
  };
}

describe("parseModelRetryPayload", () => {
  const samplePages = [{ page: 1, text: "Monthly rent is $1,450. Late fee $75." }];

  it("uses default file metadata when optional fields are omitted", () => {
    const pages = [{ page: 1, text: "Monthly rent is $1,450 due on the first of each month." }];
    const result = parseModelRetryPayload({
      documentId: computeContentIntegrityKey(pages),
      pages,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retry.fileName).toBe("lease-retry.txt");
      const built = buildModelRetryInput(result.retry);
      expect(built.fileSizeBytes).toBeGreaterThan(0);
      expect(built.contentType).toBeNull();
    }
  });

  it("rejects missing documentId", () => {
    const result = parseModelRetryPayload({ pages: samplePages });
    expect(result.ok).toBe(false);
  });

  it("accepts a valid retry payload", () => {
    const result = parseModelRetryPayload(validPayload(samplePages));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retry.contentIntegrityKey).toBe(computeContentIntegrityKey(samplePages));
      expect(result.retry.pages).toHaveLength(1);
    }
  });

  it("accepts tampered content when integrity key matches (integrity check only)", () => {
    const payload = {
      documentId: computeContentIntegrityKey([{ page: 1, text: "Tampered rent $9,999." }]),
      pages: [{ page: 1, text: "Tampered rent $9,999." }],
    };
    const result = parseModelRetryPayload(payload);
    expect(result.ok).toBe(true);
  });

  it.each([
    ["empty pages array", { documentId: "abc", pages: [] }],
    ["missing pages", { documentId: "abc" }],
    ["invalid page number", validPayload([{ page: 0, text: "Rent $100" }])],
    ["non-integer page", validPayload([{ page: 1.5, text: "Rent $100" }])],
    ["malformed page object", { documentId: "abc", pages: ["bad"] }],
    ["empty normalized text", validPayload([{ page: 1, text: "   " }])],
    [
      "duplicate page numbers",
      {
        documentId: computeContentIntegrityKey([
          { page: 1, text: "A" },
          { page: 1, text: "B" },
        ]),
        pages: [
          { page: 1, text: "A" },
          { page: 1, text: "B" },
        ],
      },
    ],
    [
      "stale content integrity key",
      {
        documentId: "deadbeefdeadbeef",
        pages: samplePages,
      },
    ],
  ])("rejects invalid payload: %s", (_label, payload) => {
    const result = parseModelRetryPayload(payload);
    expect(result.ok).toBe(false);
  });

  it("rejects client-supplied evidence fields", () => {
    const result = parseModelRetryPayload({
      ...validPayload(samplePages),
      evidenceIndex: { "ev-fake": { page: 1, startIndex: 0, endIndex: 5, quote: "x" } },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.code).toBe("invalid_input");
    }
  });

  it("rejects excessive page count", () => {
    const pages = Array.from({ length: ANALYSIS_LIMITS.maxPages + 1 }, (_, i) => ({
      page: i + 1,
      text: "Rent clause text here.",
    }));
    const result = parseModelRetryPayload(validPayload(pages));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("too_many_pages");
  });

  it("rejects oversized total text", () => {
    const result = parseModelRetryPayload(
      validPayload([{ page: 1, text: "x".repeat(ANALYSIS_LIMITS.maxChars + 1) }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("too_many_chars");
  });

  it("rebuilds extraction metadata server-side", () => {
    const parsed = parseModelRetryPayload({
      ...validPayload(samplePages),
      extraction: {
        method: "embedded_text",
        pageCount: 99,
        totalChars: 1,
        quality: 0,
        coverageStatus: "complete",
      },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const built = buildModelRetryInput(parsed.retry);
    expect(built.extraction.pageCount).toBe(1);
    expect(built.extraction.totalChars).toBe(samplePages[0]!.text.length);
    expect(built.extraction.method).toBe("pasted_text");
  });

  it("resolves same quote on different pages using page context", () => {
    const pages = [
      { page: 1, text: "Late fee of $75 applies after grace period on page one." },
      { page: 2, text: "Late fee of $75 applies after grace period on page two." },
    ];
    const result = parseModelRetryPayload(validPayload(pages));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.retry.pages[0]?.page).toBe(1);
      expect(result.retry.pages[1]?.page).toBe(2);
    }
  });

  it("rejects total character limit overflow across multiple pages", () => {
    const pageText = "a".repeat(Math.floor(ANALYSIS_LIMITS.maxChars / 2) + 1);
    const pages = [
      { page: 1, text: pageText },
      { page: 2, text: pageText },
    ];
    const result = parseModelRetryPayload(validPayload(pages));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("too_many_chars");
  });
});

describe("parseModelRetryRequest", () => {
  it("rejects non-JSON content type", async () => {
    const result = await parseModelRetryRequest(
      new Request("http://localhost/api/analyze/retry-model", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "{}",
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects invalid JSON bodies", async () => {
    const result = await parseModelRetryRequest(
      new Request("http://localhost/api/analyze/retry-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{bad-json",
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("invalid_input");
  });

  it("rejects oversized Content-Length", async () => {
    const result = await parseModelRetryRequest(
      new Request("http://localhost/api/analyze/retry-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(MAX_MODEL_RETRY_JSON_BYTES + 1),
        },
        body: "{}",
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("payload_too_large");
  });

  it("rejects oversized raw body after read", async () => {
    const result = await parseModelRetryRequest(
      new Request("http://localhost/api/analyze/retry-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(MAX_MODEL_RETRY_JSON_BYTES + 10),
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("payload_too_large");
  });

  it("rejects when request body cannot be read", async () => {
    const request = new Request("http://localhost/api/analyze/retry-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    request.text = async () => {
      throw new Error("stream aborted");
    };
    const result = await parseModelRetryRequest(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problem.code).toBe("invalid_input");
  });
});
