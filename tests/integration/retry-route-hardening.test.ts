import { describe, expect, it } from "vitest";

import { POST as analyzePost } from "@/app/api/analyze/route";
import { POST as retryPost } from "@/app/api/analyze/retry-model/route";

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("analysis routes", () => {
  it("removes the former AI retry endpoint", async () => {
    const response = await retryPost(
      jsonRequest("http://localhost/api/analyze/retry-model", { documentId: "removed" }),
    );

    expect(response.status).toBe(410);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining("AI analysis has been removed"),
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
