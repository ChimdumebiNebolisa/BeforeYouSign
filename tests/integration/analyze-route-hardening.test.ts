import { describe, expect, it } from "vitest";

import { POST as analyzePost } from "@/app/api/analyze/route";
import { ANALYSIS_LIMITS } from "@/lib/analysis/limits";
import { parseAnalysisInput } from "@/lib/analysis/pipeline/validate-intake";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function pdfUploadRequest(size: number): Request {
  const bytes = new Uint8Array(size);
  bytes.set(new TextEncoder().encode("%PDF-"));
  const formData = new FormData();
  formData.append("file", new Blob([bytes], { type: "application/pdf" }), "lease.pdf");
  formData.append("stateCode", "TX");
  return new Request("http://localhost/api/analyze", { method: "POST", body: formData });
}

describe("analysis route hardening", () => {
  it("accepts a PDF at the 4 MiB application limit", async () => {
    const parsed = await parseAnalysisInput(pdfUploadRequest(ANALYSIS_LIMITS.maxPdfBytes));

    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.fileSizeBytes).toBe(ANALYSIS_LIMITS.maxPdfBytes);
  });

  it("rejects a PDF above the 4 MiB application limit", async () => {
    const parsed = await parseAnalysisInput(pdfUploadRequest(ANALYSIS_LIMITS.maxPdfBytes + 1));

    expect(parsed).toMatchObject({ ok: false, problem: { code: "payload_too_large", httpStatus: 413 } });
  });

  it("rejects an oversized multipart stream without a content-length header", async () => {
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=streamed" },
        body: "x".repeat(ANALYSIS_LIMITS.maxMultipartRequestBytes + 1),
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "payload_too_large" },
    });
  });

  it("still rejects oversized pasted text before processing", async () => {
    const response = await analyzePost(
      jsonRequest("http://localhost/api/analyze", {
        leaseText: "x".repeat(120_001),
        stateCode: "TX",
      }),
    );
    expect(response.status).toBe(413);
  });

  it("returns a client error for malformed multipart bodies", async () => {
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=bad" },
        body: "not-a-multipart-body",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "invalid_input", message: "Invalid multipart form body." },
    });
  });

  it("rejects oversized JSON bodies before parsing JSON", async () => {
    const response = await analyzePost(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "x".repeat(600_000),
      }),
    );

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({
      ok: false,
      error: { code: "payload_too_large" },
    });
  });
});
